import React from 'react';
import { withTranslation } from 'react-i18next';

import InfoTooltip from './InfoTooltip';
import { getPumpVocabulary } from '../../../utils/device';
import { TWIIST_RECOGNIZED_ALARM_TYPES, TANDEM_RECOGNIZED_ALARM_TYPES } from '../../../utils/constants';

const EventsInfoTooltip = props => {
  const { t, ...tooltipProps } = props;

  // Which alarms are recognized/shown varies by device — derived from the
  // same source DataUtil uses to tag them (constants.js), so this can't go
  // stale relative to what's actually being tagged again. This tooltip isn't
  // wired to the viewer's actual device, so it describes both recognized
  // sets rather than guessing which applies.
  const twiistLabels = getPumpVocabulary('twiist');
  const tandemLabels = getPumpVocabulary('tandem');

  const content = {
    title: t('Events Shown'),
    subtitle: t('Tidepool displays certain pump alarms, device time changes, and notes. Which alarms are shown, and how many, depends on the pump.'),
    sections: [
      {
        title: t('Pump Alarms Shown — twiist'),
        items: TWIIST_RECOGNIZED_ALARM_TYPES.map(type => t(twiistLabels[type])),
      },
      {
        title: t('Pump Alarms Shown — Tandem'),
        items: TANDEM_RECOGNIZED_ALARM_TYPES.map(type => t(tandemLabels[type])),
        note: t('Please note that not all pump alarms are shown.'),
      },
    ],
  };

  return <InfoTooltip {...tooltipProps} content={content} offset={{ top: 60, left: 0 }} />;
};

EventsInfoTooltip.propTypes = InfoTooltip.propTypes;
EventsInfoTooltip.defaultProps = InfoTooltip.defaultProps;

export default withTranslation()(EventsInfoTooltip);
