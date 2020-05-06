# 每周总结可以写在这里
EventLoop

JavaScript本身并没有事件循环，而是其宿主提供的，如Browser、Node

"Event Loop是一个程序结构，用于等待和发送消息和事件。（a programming construct that waits for and dispatches events or messages in a program.）"

简单说，就是在程序中设置两个线程：一个负责程序本身的运行，称为"主线程"；另一个负责主线程与其他进程（主要是各种I/O操作）的通信，被称为"Event Loop线程"（可以译为"消息线程"）

当浏览器执行一段JavaScript代码时，就会产生一个宏任务，所以宏任务是相对于宿主而言的，不是由JavaScript产生的。 像setTimeout、setInteral这些是浏览器提供的API产生的是宏任务。而事件监听也是由浏览器去实现的，所以也是宏任务。宏任务产生的本质是浏览器去执行一段JavaScript代码。

每个宏任务都是由若干个微任务组成，微任务是对于JavaScript而言的，每执行一段JavaScript代码会首先产生一个微任务，然后去执行这个微任务。JavaScript内部有一个异步队列，当碰到promise.then、async时，会产生一个微任务，并添加到该队尾中，待当前的微任务执行完成之后。如果该队列不为空，则会取出队首的微任务执行，重复上述步骤直到微任务都已执行完毕。当碰到setTimeout、setInteral及事件监听时，会交由浏览器处理，浏览器会适时的产生一个宏任务