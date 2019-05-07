import EventEmitter, {
  hasProperty
} from './EventEmitter';

import defaultMessages from './messages';

export const merge = (target, ...objects) => {
  return Object.assign(target, ...objects);
}

const showError = (property) => {
  if (hasProperty(defaultMessages, property)) {
    throw new Error(defaultMessages[property]);
  }
};

class Timeline extends EventEmitter {

  constructor({
      $timeline,
      $bullet,
      $dates,
      speed = .2,
      ease = Expo.easeInOut,
      initialPosition = 1,
      vertical = false,
      messages = {},
  }) {
      super();

      let _this           = this;
      this._init          = false;

      this.$timeline      = $timeline;
      this.$bullet        = $bullet;
      this.$dates         = $dates;
      this.$window        = $(window),
      this.vertical       = vertical;
      this.speed          = speed;
      this.ease           = ease;
      this.count          = initialPosition - 1;
      this.totalLength    = this.$dates.length - 1;
      this.bulletPosition = 0;

      /*
          Message Errors
      */

      merge(defaultMessages, messages);

      if (!this.$timeline.length) {
          showError('timeline');
      }

      if (!this.$bullet.length) {
          showError('bullet');
      }

      if (!this.$dates.length) {
          showError('dates');
      }

      /*
          DOM Events
      */
      this.DOMEvents = {
          onDateClick(event) {
              event.preventDefault();
              _this.goTo(_this.getIndexByDate(this));
          },
          onWindowResize(event) {
              if (_this._init) {
                  _this.animateTo(_this.getCurrentDate());
              }
          }
      };


      /*
          Custom Events
      */

      this.on('beforeChange', () => {});
      this.on('afterChange', () => {});

      /*
          Start App
      */
      this.start();

  }

  start() {
      this.loadEvents();
      this.init = true;
  }

  merge(target, ...objects) {
    return Object.assign(target, ...objects);
  }

  showError(property) {
    return getMessages(this.messages)(property);
  }

  loadEvents() {
      this.$dates.on('click', this.DOMEvents.onDateClick);
      this.$window.on('resize', this.DOMEvents.onWindowResize);
  }

  setBulletPosition({ value, speed = this.speed, ease = this.ease }) {
      const direction = this.vertical ? 'y' : 'x';
      const onComplete = () => {
          this.bulletPosition = value;

          this.trigger('afterChange', {
              eventName: 'afterChange',
              context: this,
              currentIndex: this.count,
              bulletPosition: this.bulletPosition,
              direction: null,
              $date: this.getCurrentDate()
          })
      };

      TweenMax.to(this.$bullet, speed, {
          [direction]: value,
          ease,
          onComplete
      });
  }

  getLimit() {
    return this.getOffset(this.$timeline) + this.$timeline.innerWidth();
  }

  getTimelineHeight() {
    return this.$timeline.innerHeight();
  }

  getCurrentDate() {
    return this.$dates.eq(this.count);
  }

  getOffset($el) {
    return $el.offset()[this.vertical ? 'top': 'left'];
  }

  getIndexByDate(date) {
    return this.$dates.index(date);
  }

  getDateByIndex(index) {
    return this.$dates.eq(index);
  }

  calculateBulletPosition($date) {
    const timelineOffset = this.getOffset(this.$timeline);
    const currentDateOffset = this.getOffset($date);
    const offset = currentDateOffset - timelineOffset;
    return Math.floor($date[this.vertical ? 'innerHeight' : 'innerWidth']() / 2) + offset;
  }

  animateTo($date) {
      this.bulletPosition = this.calculateBulletPosition($date);

      this.setBulletPosition({
          value: `${this.bulletPosition}px`
      });
  }

  goTo(index) {

      index = Number(index);

      if (!(typeof index === 'number')) {
          showError('goto:index');
      }

      if (!(index >= 0 || index <= this.totalLength)) {
          showError('goto:outofrange');
      }

      this.trigger('beforeChange', {
          eventName: 'beforeChange',
          context: this,
          bulletPosition: this.bulletPosition,
          nextBulletPosition: this.calculateBulletPosition(this.getDateByIndex(index)),
          currentIndex: this.count,
          nextIndex: index,
          direction: index > this.count ? 'next' : 'previous',
          $date: this.getCurrentDate()
      });

      this.count = index;

      this.animateTo(this.getCurrentDate());
  }

  next() {

      if (this.count === this.totalLength) {
          return false;
      }

      if (this.count <= this.totalLength) {
          this.count++;
      }

      this.goTo(this.count);
  }

  prev() {

      if (this.count === 0) {
          return false;
      }

      if (this.count > 0) {
          this.count--;
      }

      this.goTo(this.count);
  }

  destroy() {
      this.$bullet.removeAttr('style');

      this.$dates.off('click', this.DOMEvents.onDateClick);
      this.$window.off('resize', this.DOMEvents.onWindowResize);

      delete this;
  }
}

export default Timeline;
