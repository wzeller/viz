/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2017, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

/* global PDFDocument, blobStream */
import Promise from 'bluebird';
import _ from 'lodash';
import DailyPrintView from './DailyPrintView';
import BasicsPrintView from './BasicsPrintView';
import { reshapeBgClassesToBgBounds } from '../../utils/bloodglucose';
import { selectDailyViewData } from '../../utils/print/data';

// Exporting utils for easy stubbing in tests
export const utils = {
  reshapeBgClassesToBgBounds,
  selectDailyViewData,
  PDFDocument: class PDFDocumentStub {},
  blobStream: function blobStreamStub() {},
  DailyPrintView,
  BasicsPrintView,
};

// DPI here is the coordinate system, not the resolution; sub-dot precision renders crisply!
const DPI = 72;
const MARGIN = DPI / 2;

/**
 * createPrintView
 * @param {Object} doc - PDFKit document instance
 * @param {Object} data - pre-munged data for the daily print view
 * @param {Object} bgPrefs - user's blood glucose thresholds & targets
 * @param {Object} timePrefs - object containing timezoneAware Boolean, timezoneName String or null
 * @param {Number} numDays - number of days of daily view to include in printout
 * @param {Object} patient - full tidepool patient object
 *
 * @return {Object} dailyPrintView instance
 */
export function createPrintView(type, data, opts, doc) {
  const {
    bgPrefs,
    patient,
    timePrefs,
  } = opts;

  let Renderer;
  let renderOpts;

  switch (type) {
    case 'daily': {
      Renderer = utils.DailyPrintView;

      const CHARTS_PER_PAGE = 3;

      const {
        numDays,
      } = opts;

      renderOpts = {
        bgPrefs,
        chartsPerPage: CHARTS_PER_PAGE,
        // TODO: set this up as a Webpack Define plugin to pull from env variable
        // maybe that'll be tricky through React Storybook?
        debug: false,
        defaultFontSize: 8,
        dpi: DPI,
        footerFontSize: 8,
        headerFontSize: 14,
        height: 11 * DPI - (2 * MARGIN),
        margins: {
          left: MARGIN,
          top: MARGIN,
          right: MARGIN,
          bottom: MARGIN,
        },
        numDays,
        patient,
        summaryHeaderFontSize: 10,
        summaryWidthAsPercentage: 0.18,
        timePrefs,
        width: 8.5 * DPI - (2 * MARGIN),
      };
      break;
    }
    case 'basics': {
      Renderer = utils.BasicsPrintView;

      renderOpts = {
        bgPrefs,
        // TODO: set this up as a Webpack Define plugin to pull from env variable
        // maybe that'll be tricky through React Storybook?
        debug: false,
        defaultFontSize: 8,
        dpi: DPI,
        footerFontSize: 8,
        headerFontSize: 14,
        height: 11 * DPI - (2 * MARGIN),
        margins: {
          left: MARGIN,
          top: MARGIN,
          right: MARGIN,
          bottom: MARGIN,
        },
        patient,
        summaryHeaderFontSize: 10,
        summaryWidthAsPercentage: 0.18,
        timePrefs,
        width: 8.5 * DPI - (2 * MARGIN),
      };
      break;
    }

    default:
      return null;
  }

  return new Renderer(doc, data, renderOpts);
}

/**
 * createPrintPDFPackage
 * @param {String} mostRecent - an ISO 8601-formatted timestamp of the most recent diabetes datum
 * @param {Array} groupedData - Object of tideline-preprocessed Tidepool diabetes data & notes;
 *                       grouped by type
 * @param {Object} opts - an object of print options (see destructured param below)
 *
 * @return {Promise} - Promise that resolves with an object containing the pdf blob and url
 */
export function createPrintPDFPackage(data, opts) {
  const {
    bgPrefs,
    numDays,
    timePrefs,
    mostRecent,
  } = opts;

  const pdfOpts = _.cloneDeep(opts);

  return new Promise((resolve, reject) => {
    pdfOpts.bgPrefs.bgBounds = utils.reshapeBgClassesToBgBounds(bgPrefs);
    const DocLib = typeof PDFDocument !== 'undefined' ? PDFDocument : utils.PDFDocument;
    const streamLib = typeof blobStream !== 'undefined' ? blobStream : utils.blobStream;

    /* NB: if you don't set the `margin` (or `margins` if not all are the same)
    then when you are using the .text() command a new page will be added if you specify
    coordinates outside of the default margin (or outside of the margins you've specified)
    */
    const doc = new DocLib({ autoFirstPage: false, bufferPages: true, margin: MARGIN });
    const stream = doc.pipe(streamLib());

    const basicsPrintView = createPrintView('basics', data.basics, pdfOpts, doc);

    const dailyViewData = utils.selectDailyViewData(mostRecent, data.daily, numDays, timePrefs);
    const dailyPrintView = createPrintView('daily', dailyViewData, pdfOpts, doc);

    basicsPrintView.render();
    dailyPrintView.render();
    doc.end();

    console.log('whaaa');

    stream.on('finish', () => {
      const pdf = {
        blob: stream.toBlob(),
        url: stream.toBlobURL('application/pdf'),
      };
      return resolve(pdf);
    });

    stream.on('error', (error) => {
      stream.end();
      return reject(error);
    });
  });
}

export default createPrintPDFPackage;
