'use strict';

const resolve = require('./resolve.macro');

// resolve;
// console.log(resolve());
// console.log(resolve(4));
// console.log(resolve('sendgrid-event', 'yo', arg, 2 + 2));
console.log(resolve('sendgrid-event'));
// console.log(resolve('view_lesson_task', 'qpa'));
console.log(resolve('view_lesson_task', 'yo', arg, 2 + 2));
// console.log(resolve('view_lesson_task', 'yo', { 2: 'yo' }));
// console.log(resolve('view_lesson_task', 'yo', { arg }));
// console.log(resolve('view_lesson_task', 'yo', { number: arg }));
// console.log(resolve('view_lesson_task', 'yo', { slug: arg }));
// console.log(resolve('view_lesson_task', 'yo', { slug: arg }, 'something'));
console.log(resolve('view_lesson_task', 'yo', { slug: arg, task_name: something }));
console.log(resolve('view_lesson_task', 'yo', { slug: arg, task_name: 'something' }));
console.log(resolve('view_lesson_task', 'yo', { slug: arg, task_name: some + thing }));
console.log(resolve('view_lesson_task', 'yo', { slug: arg, task_name: `${some}${thing}` }));
console.log(resolve('view_lesson_task', 'yo', { slug: arg, task_name: `${'some'}${'thing'}` }));
