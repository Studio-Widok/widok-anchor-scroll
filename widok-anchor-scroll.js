import $ from 'cash-dom';
import throttle from 'widok-throttle';
import createScrollItem from 'widok-scroll-item';
import widok from 'widok';

/**
 * @typedef {Object} options
 * @property {string} bullets `[default = '.anchor-bullet']` - selector of the bullets
 * @property {string} sections `[default = '.section']` - selector of the sections
 * @property {string} wrap - selector of the bullet wrap, will be populated with bullets. `bullet` property is ignored.
 * @property {string} scrollNext - `[default = '#anchor-scroll-next']` - selector of scroll to next
 */

class AnchorSet {
  constructor(options) {
    this.prepareOptions(options);

    this.bullets = [];
    if (this.options.wrap === undefined) {
      $(this.options.bullets).each((i, element) => {
        this.bullets[i] = new Bullet(element, i, this);
      });
    } else {
      const wrap = $(this.options.wrap);
      const count = $(this.options.sections).length;
      for (let i = 0; i < count; i++) {
        this.bullets[i] = new Bullet(
          $('<div class="anchor-bullet">').appendTo(wrap),
          i,
          this
        );
      }
    }

    this.sections = [];
    $(this.options.sections).each((index, element) => {
      this.sections.push(new Section(element, index, this));
    });

    this.current = this.findCurrent();
    this.isScrollNextVisible = true;
    this.scrollNext = $(this.options.scrollNext);
  }

  prepareOptions(options) {
    this.options = {
      bullets: '.anchor-bullet',
      sections: '.section',
      scrollNext: '#anchor-scroll-next',
    };
    Object.assign(this.options, options);
  }

  findCurrent() {
    this.sections.forEach(section => {
      section.calculateDistance();
    });
    this.current = this.sections.reduce((prevValue, currValue) =>
      currValue.distance > prevValue.distance ? prevValue : currValue
    );

    if (this.current.id === this.sections[0].id) {
      this.toggleScrollNext(false);
      if (this.current.distance < widok.h / 2) {
        this.current.bullet.markCurrent();
      } else {
        this.current.bullet.removeCurrent();
        this.current = undefined;
      }
    } else if (this.current.id === this.sections[this.sections.length - 1].id) {
      this.toggleScrollNext(true);
      if (this.current.distance >= widok.h / 4) {
        this.current.bullet.removeCurrent();
        this.current = undefined;
      } else {
        this.current.bullet.markCurrent();
      }
    } else {
      this.current.bullet.markCurrent();
      this.toggleScrollNext(false);
    }
  }

  scrollToPrev() {
    let isPrev = false;
    if (this.current === undefined) {
      if (this.sections[this.sections.length - 1].distanceDirection < 0) {
        this.sections[this.sections.length - 1].goTo();
      }
    } else {
      for (let i = this.sections.length - 1; i >= 0; i--) {
        if (isPrev) {
          this.sections[i].goTo();
          break;
        }
        if (this.sections[i].id === this.current.id) {
          isPrev = true;
        }
      }
    }
  }

  scrollToNext() {
    let isNext = false;
    if (this.current === undefined) {
      if (this.sections[0].distanceDirection > 0) {
        this.sections[0].goTo();
      }
    } else {
      for (let i = 0; i < this.sections.length; i++) {
        if (isNext) {
          this.sections[i].goTo();
          break;
        }
        if (this.sections[i].id === this.current.id) {
          isNext = true;
        }
      }
    }
  }

  toggleScrollNext(shouldHide) {
    if (this.scrollNext !== undefined) {
      if (shouldHide && this.isScrollNextVisible) {
        this.scrollNext.addClass('hide');
        this.isScrollNextVisible = false;
      } else if (!shouldHide && !this.isScrollNextVisible) {
        this.scrollNext.removeClass('hide');
        this.isScrollNextVisible = true;
      }
    }
  }
}

class Section {
  constructor(element, index, set) {
    this.element = $(element);
    this.id = index;
    if (this.element.data('anchor-id') !== undefined) {
      this.id = this.element.data('anchor-id');
    }
    this.set = set;

    this.bullet = this.set.bullets.filter(bullet => bullet.id === this.id)[0];
    this.bullet.section = this;

    this.scrollItem = createScrollItem(this.element);
  }

  goTo() {
    let anchorTop = this.scrollItem.offset;
    if (this.scrollItem.height < widok.h) {
      anchorTop += (this.scrollItem.height - widok.h) / 2;
    }
    anchorTop = Math.min(anchorTop, $(document).height() - widok.h);
    anchorTop = Math.max(anchorTop, 0);
    window.scrollTo({ top: anchorTop, behavior: 'smooth' });
  }

  calculateDistance() {
    const afterCenter = this.scrollItem.offset - widok.s - widok.h / 2;
    const beforeCenter =
      widok.s + widok.h / 2 - this.scrollItem.offset - this.scrollItem.height;
    this.distance = Math.max(0, afterCenter, beforeCenter);
    this.distanceDirection = afterCenter > 0 ? 1 : -1;
    return this.distance;
  }
}
class Bullet {
  constructor(element, index) {
    this.element = $(element);
    this.id = index;
    if (this.element.data('anchor-id') !== undefined) {
      this.id = this.element.data('anchor-id');
    }

    this.element.on('click', () => this.section.goTo());
  }

  markCurrent() {
    this.element.addClass('anchor-current');
    this.section.set.sections.forEach(section => {
      if (section.id === this.section.id) return;
      section.bullet.element.removeClass('anchor-current');
    });
  }

  removeCurrent() {
    this.element.removeClass('anchor-current');
  }
}

window.addEventListener(
  'scroll',
  throttle(100, () => {
    anchorSets.forEach(set => set.findCurrent());
  })
);
window.addEventListener('afterLayoutChange', () => {
  anchorSets.forEach(set => set.findCurrent());
});

const anchorSets = [];

/**
 * Creates a set of anchors (sections) and links (bulelts). Each bullet and section can have a `data-anchor-id` linking them together. Otherwise they will be connected in the order they appear on page.
 * @param {options} options
 *
 * @returns {Object} AnchorSet object - holds the reference to all sections and bullets
 */
function createAnchorScroll(options) {
  const anchorSet = new AnchorSet(options);
  anchorSets.push(anchorSet);
  return anchorSet;
}

export default createAnchorScroll;
