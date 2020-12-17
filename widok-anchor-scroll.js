const $ = require('cash-dom');
const throttle = require('widok-throttle');
const createScrollItem = require('widok-scroll-item');
const widok = require('widok');

/**
 * Prepare and create AnchorScroll
 *
 * @param {selector} wraperNav navigation wraper
 * @param {selector} singleNav single element in navigation
 * @param {selector} anchorSection anchor for specify section
 * @param {object} options extra options
 * @param {function} options.onScroll callback function which is executed on scroll
 * @returns {array} array of NavScroll object
 */

const navScrollCollection = [];
let $wraperNav;

class NavScroll {
  constructor($t, id, anchor, title, img, options) {
    this.$t = $t;
    this.id = id;
    this.anchor = anchor;
    this.title = title;
    this.img = img;
    this.scrollItem = createScrollItem(this.anchor);
    this.disable = false;
    this.currentId;

    this.options = options;
    this.onScroll = this.options.onScroll;

    this.$t.on('click', () => {
      goTo(this.id);
    });
  }
}

function goTo(id) {
  let scrollItem = navScrollCollection[id].scrollItem;
  let anchorTop = scrollItem.offset;
  anchorTop = Math.min(
    anchorTop - 50,
    anchorTop + scrollItem.height / 2,
    $(document).height() - widok.h
  );
  anchorTop = Math.max(anchorTop, 0);
  window.scrollTo({ top: anchorTop, behavior: 'smooth' });
}

function checkIsAllOnScreen() {
  let indexOfLast = navScrollCollection.length - 1;
  if (
    Math.abs(
      navScrollCollection[0].scrollItem.offset -
        navScrollCollection[indexOfLast].scrollItem.offset -
        navScrollCollection[indexOfLast].scrollItem.height / 2
    ) < widok.h
  ) {
    if (!this.disable) {
      this.disable = true;
      $wraperNav.addClass('disable');
    }
  } else {
    if (this.disable) {
      this.disable = false;
      $wraperNav.removeClass('disable');
    }
  }
}

function setCurrentAnchor() {
  const bestIndex = navScrollCollection.reduce(function (
    bestIndex,
    current,
    i,
    arr
  ) {
    return Math.abs(current.scrollItem.screenPos(0.5) - 0.5) <
      Math.abs(arr[bestIndex].scrollItem.screenPos(0.5) - 0.5)
      ? i
      : bestIndex;
  },
  0);
  if (navScrollCollection[bestIndex] !== 0 && bestIndex !== this.currentId) {
    navScrollCollection.map(function (current, i) {
      current.$t.removeClass('current');
    });
    this.currentId = bestIndex;
    navScrollCollection[bestIndex].$t.addClass('current');
  }
  if (this.onScroll !== undefined) {
    this.onScroll.call(this, this);
  }
}

$(window)
  .on('load', () => {
    setCurrentAnchor();
    checkIsAllOnScreen();
  })
  .on('scroll', throttle(100, setCurrentAnchor))
  .on('resize', checkIsAllOnScreen);

window.addEventListener('afterLayoutChange', setCurrentAnchor);

function createAnchorScroll(wraperNav, singleNav, anchorSection, options) {
  if (options === undefined) options = {};

  $wraperNav = $(wraperNav);
  $wraperNav.find(singleNav).map(function () {
    const title = $(this).data('anchor');
    const anchor = $(anchorSection).filter(function () {
      return $(this).data('ref') === title;
    });
    const navScroll = new NavScroll(
      $(this),
      navScrollCollection.length,
      anchor,
      title,
      $(this).find('img'),
      options
    );
    navScrollCollection.push(navScroll);
  });
  return navScrollCollection;
}

if (typeof module !== 'undefined') module.exports = createAnchorScroll;
