import $ from 'cash-dom';
import throttle from 'widok-throttle';
import createScrollItem from 'widok-scroll-item';
import widok from 'widok';

/**
 * @typedef {Object} options
 * @property {string} bullets `[default = '.anchor-bullet']` - selector of the bullets
 * @property {string} sections `[default = '.section']` - selector of the sections
 * @property {string} wrap - selector of the bullet wrap, will be populated with bullets. `bullet` property is ignored.
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
  }

  prepareOptions(options) {
    this.options = {
      bullets: '.anchor-bullet',
      sections: '.section',
    };
    Object.assign(this.options, options);
  }

  findCurrent() {
    let closest;
    this.sections.forEach(section => {
      section.calculateDistance();
      if (closest === undefined || section.distance < closest.distance) {
        closest = section;
      }
    });
    closest.bullet.markCurrent();
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
