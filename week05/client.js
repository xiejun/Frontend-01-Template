const net = require('net');

class Request {
    // method, url = host + port + path
    // body: k/v
    // headers

    constructor(options) {
        this.method = options.method || 'GET';
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || '/';
        this.body = options.body || {};
        this.headers = options.headers || {};

        if (!this.headers['Content-Type']) {
            this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        if (this.headers['Content-Type'] === 'application/json') {
            this.bodyText = JSON.stringify(this.body);
        }

        if (this.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
            this.bodyText = Object.keys(this.body)
                .map((key) => {
                    return `${key}=${encodeURIComponent(this.body[key])}`;
                })
                .join('&');
            this.headers['Content-Length'] = this.bodyText.length;
        }
    }

    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r\n${Object.keys(
            this.headers,
        )
            .map((key) => `${key}: ${this.headers[key]}`)
            .join('\r\n')}\r\n\r\n${this.bodyText}\r\n\r\n`;
    }

    open(method, url) { }

    send(connection) {
        const parser = new ResponseParse;
        return new Promise((resolve, reject) => {
            if (connection) {
                connection.write(this.toString());
            } else {

                connection = net.createConnection({ host: this.host, port: this.port }, () => {
                    // 'connect' 监听器
                    console.log('已连接到服务器');
                    connection.write(this.toString());
                });
                connection.on('data', (data) => {

                    parser.receive(data.toString())
                    if (parser.isFinished) {
                        resolve(parser.response)
                    }

                    // console.log(parser.statusLine);

                    // console.log('--------parser.headers');
                    // console.log(parser.headers);
                    // console.log('--------parser.headers');
                    connection.end();
                });
                connection.on('end', () => {
                    console.log('已从服务器断开');
                });
                connection.on('error', (error) => {
                    console.log(error);
                    reject(error)
                });
            }
        });
    }
}


// 有限状态机
class ResponseParse {
    constructor() {
        // 等待 status line
        this.WAITING_STATUS_LINE = 0;
        // 等待 status line 结束: 即status line执行到 \r\n
        this.WAITING_STATUS_LINE_END = 1;
        // 等待headers的名字(key)
        this.WAITING_HEADER_NAME = 2;
        // 等待headers的名字后的空格/冒号
        this.WAITING_HEADER_SPACE = 3;
        // 等待headers的值(value)
        this.WAITING_HEADER_VALUE = 4;
        // 等待 headers 结束: 即headers执行到 \r\n
        this.WAITING_HEADER_LINE_END = 5;
        // 连续两个空行
        this.WAITING_HEADER_BLOCK_END = 6;
        // 等待 body
        this.WAITI_BODY = 7;
        // 当前状态
        this.current = this.WAITING_STATUS_LINE;
        this.statusLine = '';
        this.headers = {};
        this.headerName = '';
        this.headerValue = '';

        this.bodyParser = null;

    }
    get isFinished() {
        return this.bodyParser && this.bodyParser.isFinished;
    }

    get response() {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);

        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join(''),
        };
    }

    receive(string) {

        for (let i = 0; i < string.length; i++) {
            // charAt() 方法从一个字符串中返回指定位置的字符。
            this.receiveChar(string.charAt(i))
        }
    }
    receiveChar(char) {

        // 处理状态行
        if (this.current === this.WAITING_STATUS_LINE) {
            // 
            // console.log('--char.charCodeAt(0)');
            // console.log(char.charCodeAt(0));
            if (char === '\r') {
                // 如果到\r 就改变到  "状态行执行完毕" 状态
                this.current = this.WAITING_STATUS_LINE_END
            }
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME
            }
            else {
                this.statusLine += char;
            }

        }

        else if (this.current === this.WAITING_STATUS_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME
            }
        }


        // 处理 请求头的 key/名称
        else if (this.current === this.WAITING_HEADER_NAME) {
            if (char === ':') {
                this.current = this.WAITING_HEADER_SPACE;
            }
            // headers执行到空行了，
            else if (char === '\r') {
                //  如果headers已经执行到最后了  当执行回车键的时候
                this.current = this.WAITING_HEADER_BLOCK_END;

                // 如果headers已经执行到最后了，则开始接收body o(╯□╰)o
                if (this.headers['Transfer-Encoding'] === 'chunked') {
                    this.bodyParser = new TrunkedBodyParser();
                }
            }
            else {
                this.headerName += char;
            }
        }

        else if (this.current === this.WAITING_HEADER_SPACE) {
            if (char === ' ') {
                this.current = this.WAITING_HEADER_VALUE;
            }
        }

        // 处理 请求头的 value
        else if (this.current === this.WAITING_HEADER_VALUE) {
            if (char === '\r') {
                this.current = this.WAITING_HEADER_LINE_END;
                // 把当前的value 赋值给当前的header键
                this.headers[this.headerName] = this.headerValue;

                this.headerName = '';
                this.headerValue = '';
            } else {
                this.headerValue += char;
            }
        }

        //
        else if (this.current === this.WAITING_HEADER_LINE_END) {

            if (char === '\n') {
                // 到下一行了 重新执行 headers 名称的设置
                this.current = this.WAITING_HEADER_NAME;
            }
        }

        // headers最后一行 执行回车
        else if (this.current === this.WAITING_HEADER_BLOCK_END) {
            if (char === '\n') {
                this.current = this.WAITI_BODY;
            }
        }
        // 开始执行 bdoy内容解析
        else if (this.current === this.WAITI_BODY) {
            this.bodyParser.receiveChar(char);
        }

    }
}


/*
思路: 
    先读数字，
    然后当回车时忽略回车，
    然后再读字符，
    依次循环
*/
class TrunkedBodyParser {
    constructor() {
        // 十进制的
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END = 1;
        this.READING_TRUNK = 2;
        this.WAITING_NEW_LINE = 3;
        this.WAITING_NEW_LINE_END = 4;


        this.length = 0;
        this.content = [];

        this.isFinished = false;

        this.current = this.WAITING_LENGTH;
    }
    receiveChar(char) {
        // 可以看到body的内容
        // console.log(JSON.stringify(char));

        // 在 this.WAITING_LENGTH 的状态下 获得当前字符块的长度
        if (this.current === this.WAITING_LENGTH) {
            if (char === '\r') {
                if (this.length === 0) {

                    // console.log('----打印出 content');
                    // console.log(this.content);

                    this.isFinished = true;
                }
                this.current = this.WAITING_LENGTH_LINE_END;
            } else {
                // 十进制的末尾加一位
                this.length *= 10;
                this.length += char.charCodeAt(0) - '0'.charCodeAt(0);

            }
        }

        // 
        else if (this.current === this.WAITING_LENGTH_LINE_END) {
            if (char === '\n') {
                this.current = this.READING_TRUNK;
            }
        }

        // 
        else if (this.current === this.READING_TRUNK) {
            this.content.push(char)
            this.length--;
            if (this.length === 0) {
                this.current = this.WAITING_NEW_LINE;
            }
        }

        // 
        else if (this.current === this.WAITING_NEW_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_NEW_LINE_END;
            }
        }

        // 
        else if (this.current === this.WAITING_NEW_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_LENGTH;
            }
        }
    }
}

async function client() {
    let request = new Request({
        method: 'POST',
        host: '127.0.0.1',
        port: '9999',
        path: '/',
        headers: {
            'X-Foo2': 'custom'
        },
        body: {
            name: 'winter'
        }
    });

    let response = await request.send();
    console.log('---------response');
    console.log(response);
};

client()