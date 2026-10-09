import React from 'react';
import _ from 'lodash';
import { render } from '@testing-library/react/pure';

import { formatClassesAsSelector } from '../../../helpers/cssmodules';

import EventsInfoTooltip from '../../../../src/components/common/tooltips/EventsInfoTooltip';
import styles from '../../../../src/components/common/tooltips/InfoTooltip.css';

const props = {
  position: { top: 200, left: 200 },
};

describe('EventsInfoTooltip', () => {
  it('should render one section per device, each with its own recognized alarm list', () => {
    const { container } = render(<EventsInfoTooltip {...props} />);
    const sectionTitles = _.map(
      container.querySelectorAll(formatClassesAsSelector(styles.row)),
      el => el.textContent
    );
    expect(sectionTitles).to.deep.equal(['Pump Alarms Shown — twiist', 'Pump Alarms Shown — Tandem']);
  });

  it('should list twiist\'s narrower recognized alarm set', () => {
    const { container } = render(<EventsInfoTooltip {...props} />);
    const itemLists = container.querySelectorAll(formatClassesAsSelector(styles.items));
    const twiistItems = _.map(
      itemLists[0].querySelectorAll(formatClassesAsSelector(styles.item)),
      el => el.textContent
    );
    expect(twiistItems).to.deep.equal(['Cassette Empty', 'Battery Empty', 'Line Blocked']);
  });

  it('should list Tandem\'s full recognized alarm set', () => {
    const { container } = render(<EventsInfoTooltip {...props} />);
    const itemLists = container.querySelectorAll(formatClassesAsSelector(styles.items));
    const tandemItems = _.map(
      itemLists[1].querySelectorAll(formatClassesAsSelector(styles.item)),
      el => el.textContent
    );
    expect(tandemItems).to.deep.equal([
      'Pump Auto-Off',
      'Insulin Delivery Stopped',
      'Reservoir Empty',
      'Battery Empty',
      'Occlusion Detected',
      'Insulin Delivery Limit Exceeded',
    ]);
  });

  it('should no longer claim alarms are only shown for twiist', () => {
    const { container } = render(<EventsInfoTooltip {...props} />);
    expect(container.textContent).not.to.include('only shown for the twiist AID system');
  });
});
