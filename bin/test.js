
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {
    constructor() {
        super();
    }
    say() {

        try {
            throw new Error('ah');
        } catch (e) {
            return this.emit('error', new Error('ah'));
        }

    }
}

const myEmitter = new MyEmitter();


myEmitter.on('error', (e) => {
    console.log(e.message);
});

myEmitter.say();

// try {
//     myEmitter.say();
// } catch (e) {
//     console.log(e.message);
// }



