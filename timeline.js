class EventEmitter {
    constructor(events = {}) {
        this.events = events;
    }

    hasProperty(object, property) {
        return Object.hasOwnProperty.call(this.events, property);
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
    }

    once(name, fn) {
        const runOnce = (...args) => {
            fn(...args);
            this.off(name, runOnce);
        };

        this.on(name, runOnce);
    }

    off(name, fn) {

        if (this.isType('function', fn)) {
            this.events[name].splice(this.events[name].indexOf(fn), 1);
        } else if (!this.events[name].length) {
            delete this.events[name];
        }
    }

    trigger(name, ...args) {

        if (!this.hasEvent(name)) {
            throw new Error(`EventEmmiter instance don\'t have a event called ${name}!`)
        }

        $.each(this.events[name], (index, fn) => fn(...args));
    }
}

class Timeline extends EventEmitter {

    constructor({
        $timeline,
        $bullet,
        $dates,
        autoplay = false,
        speed = .2,
        easing = Expo.easeInOut,
        initialPosition = 1,
        vertical = false,
        fx = TweenMax,
        messages: {},
    }) {
        super();

        let _this           = this;

        this.$timeline      = $timeline;
        this.$bullet        = $bullet;
        this.$dates         = $dates;
        this.$window        = $(window),
        this.fx             = fx;
        this.vertical       = vertical;
        this.autoplay       = autoplay;
        this.speed          = speed;
        this.easing         = easing;
        this.count          = initialPosition - 1;
        this.totalLength    = this.$dates.length - 1;

        /*
            Message Errors
        */
        this.messages = this.merge({
            "timeline": "Please, you need to inform a timeline element root!",
            "dates": "Please, you need to inform a list of date elements!",
            "bullet": "Please, you need to inform a bullet element!",
            "goto:index": "Please, index must be a Number!",
            "goto:outofrange": "Please, insert a index into the timeline range!",
        }, messages);


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
                _this.animateTo(_this.getCurrentDate());
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
        this.goTo(this.count);

        if (this.autoplay) {
            // ..
        }
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

    setDOMEvents($element, eventName, fn) {
        const context = this;

        $element.on(eventName, function(event) {
            const element = this;

            fn.call(element, event, context);
        });
    }

    removeDOMEvents($element, eventName, fn) {
        $element.off(event, fn);
    }

    setBulletPosition({ value, speed = this.speed, ease = this.easing }) {
        this.fx.to(this.$bullet, speed, {
            x: value,
            ease,
            onComplete: () => {

                // afterChange
                this.trigger('afterChange', {
                    context: this,
                    index: this.count,
                    direction: null,
                    $date: this.getCurrentDate()
                });
            }
        });
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

    animateTo($date) {
        const timelineOffset = this.getOffset(this.$timeline);
        const currentDateOffset = this.getOffset($date);
        const offset = currentDateOffset - timelineOffset;
        const bulletPosition = Math.floor($date[this.vertical ? 'innerHeight' : 'innerWidth']() / 2) + offset;

        this.setBulletPosition({
            value: `${bulletPosition}px`
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

        this.count = index;

        this.animateTo(this.getDateByIndex(this.count));
    }

    next() {

        if (this.count === this.totalLength) {
            return false;
        }

        if (this.count <= this.totalLength) {
            this.count++;
        }

        this.trigger('beforeChange', {
            context: this,
            index: this.count - 1,
            direction: 'next',
            $date: this.getDateByIndex(this.count - 1)
        });

        this.goTo(this.count);
    }

    prev() {

        if (this.count === 0) {
            return false;
        }

        if (this.count > 0) {
            this.count--;
        }

        this.trigger('beforeChange', {
            context: this,
            index: this.count + 1,
            direction: 'prev',
            $date: this.getDateByIndex(this.count + 1)
        });

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
