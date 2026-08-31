/*
 * <license header>
 */

import { InlineAlert, Heading, Content, Button, Link, Badge, Text } from '@react-spectrum/s2';
import SectionCard from './SectionCard';
import { getIcon } from './iconRegistry';

/**
 * AI Recommendation panel: a "gen AI" ask button, a recommendation alert, a row
 * of supporting/blocking factor chips, a freshness note, and follow-up actions.
 * Everything is data-driven so it can render for any gate that includes it.
 */
function AIRecommendation({ data, onAsk, onAction }) {
  if (!data) return null;

  const askAction = data.askLabel ? (
    <Button variant="genai" onPress={() => onAsk && onAsk()}>
      {data.askLabel}
    </Button>
  ) : null;

  return (
    <SectionCard title={data.title} action={askAction}>
      {data.alert && (
        <InlineAlert variant={data.alert.tone || 'negative'}>
          <Heading>{data.alert.title}</Heading>
          <Content>{data.alert.detail}</Content>
        </InlineAlert>
      )}

      {data.factors && data.factors.length > 0 && (
        <div className="es-factors">
          {data.factors.map((factor) => {
            const Icon = getIcon(factor.icon);
            return (
              <Badge key={factor.id} variant={factor.tone} fillStyle="subtle" size="S">
                {Icon && <Icon />}
                <Text>{factor.label}</Text>
              </Badge>
            );
          })}
        </div>
      )}

      {data.freshness && (
        <InlineAlert variant="informative">
          <Heading>{data.freshness.text}</Heading>
          <Content>
            <Link href={data.freshness.linkHref || '#'}>{data.freshness.linkLabel}</Link>
          </Content>
        </InlineAlert>
      )}

      {data.actions && data.actions.length > 0 && (
        <div className="es-actions">
          {data.actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              fillStyle={action.fillStyle}
              onPress={() => onAction && onAction(action.id)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default AIRecommendation;
