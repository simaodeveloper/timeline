export const hasProperty = (property, object) => {
  return Object.hasOwnProperty.call(object, property);
}

export const hasEvent = (name, events) => {
  return hasProperty(events, name);
}

export const isType = (type, value) => {
  return Object.prototype.toString.call(value) === `[object ${type[0].toUpperCase() + type.substring(1)}]`;
}

export default class EventEmitter {
  constructor(events = {}) {
    this.events = events;
  }

  on(name, fn) {

      if (!hasEvent(name, this.events)) {
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

      if (isType('function', fn)) {
          this.events[name].splice(this.events[name].indexOf(fn), 1);
      } else if (!this.events[name].length) {
          delete this.events[name];
      }
      return this;
  }

  trigger(name, ...args) {

      if (!hasEvent(name)) {
          throw new Error(`EventEmmiter instance don\'t have a event called ${name}!`)
      }

      $.each(this.events[name], (index, fn) => fn(...args));

      return this;
  }
}
