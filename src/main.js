import myLibrary from './Timeline'

const myLib = new myLibrary('#root')

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
