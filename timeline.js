class EventEmitter {
    constructor(events = {}) {
        this.events = events;
    }

    hasProperty(object, property) {
        return Object.hasOwnProperty.call(object, property);
    }

    hasEvent(name) {
        return this.hasProperty(this.events, name);
    }

    isType(type, value) {
        return Object.prototype.toString.call(value) === `[object ${type[0].toUpperCase() + type.substring(1)}]`;
    }

    on(name, fn) {

        if (!this.hasEvent(name)) {
            this.events[name] = [fn];
        } else {
            this.events[name].push(fn);
        }

        return this;
    }

    once(name, fn) {
        const runOnce = (...args) => {
            fn(...args);
            this.off(name, runOnce);
        };

        return this.on(name, runOnce);
    }

    off(name, fn) {

        if (this.isType('function', fn)) {
            this.events[name].splice(this.events[name].indexOf(fn), 1);
        } else if (!this.events[name].length) {
            delete this.events[name];
        }
        return this;
    }

    trigger(name, ...args) {

        if (!this.hasEvent(name)) {
            throw new Error(`EventEmmiter instance don\'t have a event called ${name}!`)
        }

        $.each(this.events[name], (index, fn) => fn(...args));

        return this;
    }
}

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
        const defaultMessages = {
            "timeline": "Please, you need to inform a timeline element root!",
            "dates": "Please, you need to inform a list of date elements!",
            "bullet": "Please, you need to inform a bullet element!",
            "goto:index": "Please, index must be a Number!",
            "goto:outofrange": "Please, insert a index into the timeline range!",
        };

        this.messages = this.merge(defaultMessages, messages);


        if (!this.$timeline.length) {
            this.showError('timeline');
        }

        if (!this.$bullet.length) {
            this.showError('bullet');
        }

        if (!this.$dates.length) {
            this.showError('dates');
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
    }

    merge(target, ...objects) {
        return Object.assign(target, ...objects);
    }

    showError(property) {
        if (this.hasProperty(this.messages, property)) {
            throw new Error(this.messages[property]);
        }
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
            this.showError('goto:index');
        }

        if (!(index >= 0 || index <= this.totalLength)) {
            this.showError('goto:outofrange');
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

/*
HOW TO USE - Timeline.js

const timeline = new Timeline({
    $timeline: $('.timeline-line'),
    $bullet: $('.timeline-bullet', el),
    $dates: $('.timeline-date'),
    initialPosition: 1
});

timeline.on('beforeChange', (options) => console.log(options));
timeline.on('afterChange', (options) => console.log(options));
/*
