/*
 * <license header>
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, DateRangePicker, Picker, PickerItem, ProgressCircle, SearchField, Text } from '@react-spectrum/s2';
import AlertDiamond from '@react-spectrum/s2/icons/AlertDiamond';
import CalendarIcon from '@react-spectrum/s2/icons/Calendar';
import ChevronLeft from '@react-spectrum/s2/icons/ChevronLeft';
import ChevronRight from '@react-spectrum/s2/icons/ChevronRight';
import { today } from '@internationalized/date';
import { LABELS, formatLabel } from '../../constants/labels';
import { getImsAuth } from '../../api/imsAuth';
import { registerForGateEvent } from '../../api/gateEventsClient';
import { dialogTitle, dialogDesc, bannerBody } from './styles';

const LEVEL_LABEL = { OU: LABELS.tags.ou, Category: LABELS.tags.category, Country: LABELS.tags.country };

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const RESULTS_PER_PAGE = 5;

function defaultDateRange() {
  const currentDate = today('UTC');
  return {
    start: currentDate.subtract({ months: 3 }),
    end: currentDate.add({ months: 3 }),
  };
}

function isWithinDateRange(date, range) {
  if (!range || !date) return true;
  const value = date.toISOString().slice(0, 10);
  return value >= range.start.toString() && value <= range.end.toString();
}

function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
}

/** "Oct 15, 2026". */
function formatEventDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * "Choose a Gate N event" selector (Figma 1889-121823 calendar / 1889-121630
 * list / 1889-121287 list-selected) — an inline card that sits in the main
 * gate-detail slot next to Gate Pipeline, NOT a modal. Fetches candidate
 * meeting events on mount, lets the user pick one that's eligible, and
 * registers the given gate (`taskId`, its own Workfront task id) for it. A
 * meeting is eligible only when BOTH:
 *  - this project's `DE:Initiative Type` is one of the meeting's own
 *    `DE:Initiative Type Multiselect` values, AND
 *  - the project field matching the meeting's OWN declared level (OU/Country/
 *    Category — see LEVEL_MATCH_KEY) equals that meeting's level value.
 */
function GateEventSelector({ gateNumber = '1', registrationLevel, registrationMatchFields, taskId, meetings = [], meetingsLoading = false, meetingsError = '', onCancel, onRegistered }) {
  const events = meetings;
  const status = meetingsLoading ? 'loading' : meetingsError ? 'error' : 'ready';
  const error = meetingsError;
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [gateFilter, setGateFilter] = useState('all');
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const tableRef = useRef(null);

  useEffect(() => {
    if (!calendarMonth && events.length) {
      const firstMeetingDate = events[0].date || new Date();
      setCalendarMonth(new Date(firstMeetingDate.getFullYear(), firstMeetingDate.getMonth(), 1));
    }
  }, [calendarMonth, events]);

  const selectedEvent = events.find((e) => e.id === selectedId) || null;

  const selectEvent = (e) => {
    setRegisterError('');
    setSelectedId((prev) => (prev === e.id ? null : e.id));
  };

  const handleRegister = async (event = selectedEvent) => {
    if (!event) return;
    setRegistering(true);
    setRegisterError('');
    try {
      const ctx = await getImsAuth();
      await registerForGateEvent({
        hostname: ctx.hostname,
        taskId,
        gateEventId: event.id,
        imsToken: ctx.imsToken,
        imsOrg: ctx.imsOrg,
      });
      onRegistered && onRegistered(event);
    } catch (e) {
      setRegisterError(e.message);
    } finally {
      setRegistering(false);
    }
  };

  const eventOptions = useMemo(() => [...new Set(events.map((event) => event.name))], [events]);
  const gateOptions = useMemo(() => [...new Set(events.map((event) => event.level).filter(Boolean))], [events]);
  const filteredEvents = useMemo(() => events
    .filter((event) => !search || `${event.name} ${event.levelValue || ''}`.toLowerCase().includes(search.toLowerCase()))
    .filter((event) => eventFilter === 'all' || event.name === eventFilter)
    .filter((event) => gateFilter === 'all' || event.level === gateFilter)
    .filter((event) => isWithinDateRange(event.date, dateRange))
    .sort((a, b) => b.date - a.date), [events, search, eventFilter, gateFilter, dateRange]);
  const pageCount = Math.ceil(filteredEvents.length / RESULTS_PER_PAGE);
  const visibleEvents = filteredEvents.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, eventFilter, gateFilter, dateRange]);

  useEffect(() => {
    if (currentPage > pageCount && pageCount > 0) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  useEffect(() => {
    if (!selectedId || !tableRef.current) return;
    const row = tableRef.current.querySelector(`[data-event-id="${selectedId}"]`);
    if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedId, currentPage]);

  const calendarMonths = useMemo(() => {
    if (!calendarMonth) return [];
    return [0, 1, 2].map((offset) => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1));
  }, [calendarMonth]);

  const clearFilters = () => {
    setSearch('');
    setEventFilter('all');
    setGateFilter('all');
    setDateRange(defaultDateRange());
  };

  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);

  const selectDate = (date, month) => {
    if (!date) return;
    const day = new Date(month.getFullYear(), month.getMonth(), date);
    const firstMeetingIndex = filteredEvents.findIndex((event) => event.date.toDateString() === day.toDateString());
    if (firstMeetingIndex < 0) return;
    const firstMeeting = filteredEvents[firstMeetingIndex];
    setSelectedDate(day.toDateString());
    setSelectedId(firstMeeting.id);
    setCurrentPage(Math.floor(firstMeetingIndex / RESULTS_PER_PAGE) + 1);
  };

  const R = LABELS.gateRegistration;
  const subtitle = registrationLevel
    ? formatLabel(R.modalSubtitle, { level: LEVEL_LABEL[registrationLevel.level] || registrationLevel.level, value: registrationLevel.value })
    : R.modalSubtitleNoLevel;

  return (
    <section className="es-ges">
      <div className="es-ges__header">
        <div className="es-ges__title-row">
          <button type="button" className="es-ges__back" aria-label={R.back} onClick={onCancel}>
            <ChevronLeft />
            <span>{R.back}</span>
          </button>
          <h1 className={`es-ges__title ${dialogTitle}`}>{R.upcomingTitle}</h1>
        </div>
        <p className={`es-ges__subtitle ${dialogDesc}`}>{R.upcomingSubtitle}</p>
      </div>

      {status === 'loading' && (
        <div className="es-ges__center">
          <ProgressCircle isIndeterminate aria-label={R.loading} />
          <span className={dialogDesc}>{R.loading}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="es-ges__notice">
          <span className={bannerBody}>{error || R.error}</span>
          <AlertDiamond aria-hidden="true" />
        </div>
      )}

      {status === 'ready' && events.length === 0 && (
        <div className={`es-ges__empty ${dialogDesc}`}>{R.empty}</div>
      )}

      {status === 'ready' && events.length > 0 && (
        <>
          <div className="es-ges__filters">
            <SearchField aria-label={R.search} placeholder={R.search} value={search} onChange={setSearch} />
            <Picker aria-label={R.eventFilter} selectedKey={eventFilter} onSelectionChange={setEventFilter}>
              <PickerItem id="all">{R.allEvents}</PickerItem>
              {eventOptions.map((name) => <PickerItem key={name} id={name}>{name}</PickerItem>)}
            </Picker>
            <Picker aria-label={R.gateFilter} selectedKey={gateFilter} onSelectionChange={setGateFilter}>
              <PickerItem id="all">{R.allGates}</PickerItem>
              {gateOptions.map((level) => <PickerItem key={level} id={level}>{LEVEL_LABEL[level] || level}</PickerItem>)}
            </Picker>
            <DateRangePicker
              aria-label={R.dateFilter}
              value={dateRange}
              onChange={setDateRange}
              size="M"
            />
            <button type="button" className="es-ges__clear-filters" onClick={clearFilters}>{R.clearFilters}</button>
          </div>
          <div className="es-ges__table-wrap" ref={tableRef}>
            <table className="es-ges__table">
              <thead><tr><th>{R.meetingColumn}</th><th>{R.projectColumn}</th><th>{R.dateColumn}</th><th>{R.facilitatorColumn}</th><th>{R.eligibilityColumn}</th><th aria-label={R.register} /></tr></thead>
              <tbody>
                {visibleEvents.map((event) => {
                  const selected = selectedId === event.id;
                  return (
                    <tr key={event.id} data-event-id={event.id} className={selected ? 'es-ges__table-row--selected' : ''}>
                      <td><div>{event.name}</div><span className="es-ges__gate-tag">{event.level ? LEVEL_LABEL[event.level] || event.level : R.gateLabel}</span></td>
                      <td><div>{registrationMatchFields?.initiativeType || R.projectLabel}</div><small>{registrationMatchFields?.leadingMarket || registrationMatchFields?.operatingUnit || ''}</small></td>
                      <td><span className="es-ges__date-value"><CalendarIcon />{formatEventDate(event.date)}</span></td>
                      <td>{event.facilitator || R.facilitatorUnknown}</td>
                      <td><span className="es-ges__eligibility es-ges__eligibility--match"><span />{R.legendMatch}</span></td>
                      <td><Button variant="primary" fillStyle="fill" isDisabled={registering} onPress={() => { selectEvent(event); handleRegister(event); }}><Text>{R.register}</Text></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <div className="es-ges__pagination" aria-label={R.pagination}>
              <Button
                variant="secondary"
                fillStyle="clear"
                isDisabled={currentPage === 1}
                aria-label={R.previousPage}
                onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                ‹
              </Button>
              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'primary' : 'secondary'}
                  fillStyle={page === currentPage ? 'fill' : 'clear'}
                  onPress={() => setCurrentPage(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="secondary"
                fillStyle="clear"
                isDisabled={currentPage === pageCount}
                aria-label={R.nextPage}
                onPress={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              >
                ›
              </Button>
            </div>
          )}
          <div className="es-ges__calendar-section">
            <div className="es-ges__calendar-heading">
              <h2 className={`es-ges__title ${dialogTitle}`}>{formatLabel(R.modalTitle, { number: gateNumber })}</h2>
              <p className={`es-ges__subtitle ${dialogDesc}`}>{subtitle} {R.calendarHint}</p>
            </div>
            <div className="es-ges__calendar-shell">
              <Button variant="secondary" fillStyle="clear" aria-label={R.previousMonth} onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                <ChevronLeft />
              </Button>
              {calendarMonths.map((month) => {
                const monthEvents = filteredEvents.filter((event) => event.date.getFullYear() === month.getFullYear() && event.date.getMonth() === month.getMonth());
                const eventDays = new Set(monthEvents.map((event) => event.date.getDate()));
                return (
                  <div className="es-ges__month" key={`${month.getFullYear()}-${month.getMonth()}`}>
                    <h3>{MONTH_NAMES[month.getMonth()]} {month.getFullYear()}</h3>
                    <div className="es-ges__calendar-weekdays">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
                    <div className="es-ges__calendar-grid">
                      {buildMonthGrid(month.getFullYear(), month.getMonth()).flatMap((week, weekIndex) => week.map((day, dayIndex) => (
                        <button
                          type="button"
                          key={`${weekIndex}-${dayIndex}`}
                          className={day && eventDays.has(day) ? 'es-ges__calendar-day--event' : ''}
                          aria-pressed={day ? selectedDate === new Date(month.getFullYear(), month.getMonth(), day).toDateString() : undefined}
                          onClick={() => selectDate(day, month)}
                          disabled={!day || !eventDays.has(day)}
                        >{day || ''}</button>
                      )))}
                    </div>
                  </div>
                );
              })}
              <Button variant="secondary" fillStyle="clear" aria-label={R.nextMonth} onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      )}

      {registerError && (
        <div className="es-ges__notice">
          <span className={bannerBody}>{registerError}</span>
          <AlertDiamond aria-hidden="true" />
        </div>
      )}

      {onCancel && registering && <Button variant="secondary" fillStyle="clear" onPress={onCancel}>{R.cancel}</Button>}
    </section>
  );
}

export default GateEventSelector;
