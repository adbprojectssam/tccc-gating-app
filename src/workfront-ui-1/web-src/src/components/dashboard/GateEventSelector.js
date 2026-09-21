/*
 * <license header>
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ActionButton, ProgressCircle, Text } from '@react-spectrum/s2';
import AlertDiamond from '@react-spectrum/s2/icons/AlertDiamond';
import Checkmark from '@react-spectrum/s2/icons/Checkmark';
import CalendarIcon from '@react-spectrum/s2/icons/Calendar';
import ListBulleted from '@react-spectrum/s2/icons/ListBulleted';
import ChevronLeft from '@react-spectrum/s2/icons/ChevronLeft';
import ChevronRight from '@react-spectrum/s2/icons/ChevronRight';
import { LABELS, formatLabel } from '../../constants/labels';
import { getImsAuth } from '../../api/imsAuth';
import { fetchGateEvents, registerForGateEvent } from '../../api/gateEventsClient';
import { dialogTitle, dialogDesc, bannerBody } from './styles';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const LEVEL_LABEL = { OU: LABELS.tags.ou, Category: LABELS.tags.category, Country: LABELS.tags.country };

/** "Oct 15, 2026". */
function formatEventDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Monday-first month grid: array of weeks, each 7 entries (day-of-month or null). */
function buildMonthGrid(year, month) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0..Sun=6
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// Meeting's "DE:What level is your Gate Meeting?" value → which project-side
// field (from `registrationMatchFields`) that level's own value is checked
// against. Matches the product rule: OU↔Operating Unit, Country↔Leading
// Market vs. the meeting's Primary Launch Market Country, Category↔Global
// Category — independent of whichever single level this project would show
// in its own subtitle (`registrationLevel`).
const LEVEL_MATCH_KEY = { OU: 'operatingUnit', Country: 'leadingMarket', Category: 'category' };

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
function GateEventSelector({ registrationLevel, registrationMatchFields, taskId, onCancel, onRegistered }) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('calendar'); // calendar | list
  const [viewYear, setViewYear] = useState(null);
  const [viewMonth, setViewMonth] = useState(null); // 0-11
  const [selectedId, setSelectedId] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const ctxRef = useRef(null);

  const isEligible = (e) => {
    const f = registrationMatchFields;
    if (!f || !f.initiativeType) return false;
    if (!(e.initiativeTypes || []).includes(f.initiativeType)) return false;
    const matchKey = LEVEL_MATCH_KEY[e.level];
    if (!matchKey) return false;
    const projectValue = f[matchKey];
    return !!projectValue && e.levelValue === projectValue;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ctx = await getImsAuth();
        ctxRef.current = ctx;
        const list = await fetchGateEvents({ hostname: ctx.hostname, imsToken: ctx.imsToken, imsOrg: ctx.imsOrg });
        if (!active) return;
        setEvents(list);
        const eligible = list.filter(isEligible);
        const earliest = (eligible.length ? eligible : list).reduce(
          (min, e) => (!min || e.date < min.date ? e : min),
          null,
        );
        const base = earliest ? earliest.date : new Date();
        setViewYear(base.getFullYear());
        setViewMonth(base.getMonth());
        setStatus('ready');
      } catch (e) {
        if (!active) return;
        setError(e.message);
        setStatus('error');
      }
    })();
    return () => {
      active = false;
    };
    // registrationMatchFields is fixed for this card's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eligibleCount = useMemo(() => events.filter(isEligible).length, [events, registrationMatchFields]);
  const selectedEvent = events.find((e) => e.id === selectedId) || null;

  const selectEvent = (e) => {
    if (!isEligible(e)) return;
    setRegisterError('');
    setSelectedId((prev) => (prev === e.id ? null : e.id));
  };

  const goPrevMonth = () =>
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  const goNextMonth = () =>
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });

  const handleRegister = async () => {
    if (!selectedEvent) return;
    setRegistering(true);
    setRegisterError('');
    try {
      const ctx = ctxRef.current || (await getImsAuth());
      await registerForGateEvent({
        hostname: ctx.hostname,
        taskId,
        gateEventId: selectedEvent.id,
        imsToken: ctx.imsToken,
        imsOrg: ctx.imsOrg,
      });
      onRegistered && onRegistered(selectedEvent);
    } catch (e) {
      setRegisterError(e.message);
    } finally {
      setRegistering(false);
    }
  };

  const weeks = useMemo(() => (viewYear != null ? buildMonthGrid(viewYear, viewMonth) : []), [viewYear, viewMonth]);
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (viewYear != null && e.date.getFullYear() === viewYear && e.date.getMonth() === viewMonth) {
        const d = e.date.getDate();
        (map[d] = map[d] || []).push(e);
      }
    });
    return map;
  }, [events, viewYear, viewMonth]);
  const sortedEvents = useMemo(() => events.slice().sort((a, b) => a.date - b.date), [events]);

  const R = LABELS.gateRegistration;
  const subtitle = registrationLevel
    ? formatLabel(R.modalSubtitle, { level: LEVEL_LABEL[registrationLevel.level] || registrationLevel.level, value: registrationLevel.value })
    : R.modalSubtitleNoLevel;

  return (
    <section className="es-ges">
      <div className="es-ges__header">
        <h2 className={`es-ges__title ${dialogTitle}`}>{R.modalTitle}</h2>
        <p className={`es-ges__subtitle ${dialogDesc}`}>{subtitle}</p>
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
          <div className="es-ges__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'calendar'}
              className={`es-ges__tab ${activeTab === 'calendar' ? 'es-ges__tab--active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              <CalendarIcon />
              <span>{R.tabCalendar}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'list'}
              className={`es-ges__tab ${activeTab === 'list' ? 'es-ges__tab--active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              <ListBulleted />
              <span>{R.tabList}</span>
            </button>
          </div>

          {registrationLevel && eligibleCount === 0 && (
            <div className={`es-ges__hint ${dialogDesc}`}>{R.noEligible}</div>
          )}

          {activeTab === 'calendar' ? (
            <div className="es-ges__calendar">
              <div className="es-ges__nav">
                <ActionButton UNSAFE_className="es-ges__nav-btn" aria-label={R.prevMonth} onPress={goPrevMonth}>
                  <ChevronLeft />
                </ActionButton>
                <span className="es-ges__month">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <ActionButton UNSAFE_className="es-ges__nav-btn" aria-label={R.nextMonth} onPress={goNextMonth}>
                  <ChevronRight />
                </ActionButton>
              </div>

              <div className="es-ges__legend">
                <span className="es-ges__legend-item">
                  <span className="es-ges__dot es-ges__dot--match" />
                  {R.legendMatch}
                </span>
                <span className="es-ges__legend-item">
                  <span className="es-ges__dot es-ges__dot--none" />
                  {R.legendNonEligible}
                </span>
              </div>

              <div className="es-ges__weekdays">
                {WEEKDAY_LABELS.map((w) => (
                  <span key={w} className="es-ges__weekday">{w}</span>
                ))}
              </div>

              <div className="es-ges__grid">
                {weeks.map((week, wi) => (
                  <div className="es-ges__week" key={wi}>
                    {week.map((day, di) => {
                      if (day == null) return <div className="es-ges__cell es-ges__cell--blank" key={di} />;
                      const dayEvents = eventsByDay[day] || [];
                      const primary = dayEvents[0];
                      const eligible = primary && isEligible(primary);
                      const selected = primary && selectedId === primary.id;
                      return (
                        <button
                          type="button"
                          key={di}
                          className={[
                            'es-ges__cell',
                            primary ? 'es-ges__cell--event' : '',
                            eligible ? 'es-ges__cell--eligible' : '',
                            selected ? 'es-ges__cell--selected' : '',
                          ].filter(Boolean).join(' ')}
                          disabled={!eligible}
                          onClick={() => primary && selectEvent(primary)}
                        >
                          <span className="es-ges__date">{day}</span>
                          {primary && (
                            <span className="es-ges__event">
                              <span className={`es-ges__dot ${eligible ? 'es-ges__dot--match' : 'es-ges__dot--none'}`} />
                              <span className="es-ges__event-name">{primary.name}</span>
                            </span>
                          )}
                          {dayEvents.length > 1 && (
                            <span className="es-ges__more">{formatLabel(R.moreEvents, { count: dayEvents.length - 1 })}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="es-ges__list">
              {sortedEvents.length === 0 ? (
                <div className={dialogDesc}>{R.listEmpty}</div>
              ) : (
                sortedEvents.map((e) => {
                  const eligible = isEligible(e);
                  const selected = selectedId === e.id;
                  return (
                    <button
                      type="button"
                      key={e.id}
                      className={[
                        'es-ges__row',
                        eligible ? 'es-ges__row--eligible' : '',
                        selected ? 'es-ges__row--selected' : '',
                      ].filter(Boolean).join(' ')}
                      disabled={!eligible}
                      onClick={() => selectEvent(e)}
                    >
                      <span className={`es-ges__radio ${selected ? 'es-ges__radio--selected' : ''}`} aria-hidden="true" />
                      <span className="es-ges__row-details">
                        <span className="es-ges__row-name">{e.name}</span>
                        <span className="es-ges__row-date">{formatEventDate(e.date)}</span>
                      </span>
                      {eligible ? (
                        <span className="es-ges__row-status es-ges__row-status--match">
                          <Checkmark aria-hidden="true" />
                          {R.legendMatch}
                        </span>
                      ) : (
                        <span className="es-ges__row-status es-ges__row-status--none">
                          {formatLabel(R.notEligibleReason, { level: LEVEL_LABEL[e.level] || e.level, value: e.levelValue })}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {registerError && (
        <div className="es-ges__notice">
          <span className={bannerBody}>{registerError}</span>
          <AlertDiamond aria-hidden="true" />
        </div>
      )}

      <div className="es-ges__footer">
        <Button variant="secondary" fillStyle="outline" isDisabled={registering} onPress={onCancel}>
          {R.cancel}
        </Button>
        <Button variant="primary" fillStyle="fill" isDisabled={!selectedEvent || registering} onPress={handleRegister}>
          {registering ? <ProgressCircle size="S" isIndeterminate aria-label={R.registering} /> : <Text>{R.register}</Text>}
        </Button>
      </div>
    </section>
  );
}

export default GateEventSelector;
