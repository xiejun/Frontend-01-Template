```javascript

function convertStringToNumber(str, x) {
            if (arguments.length < 2) {
                x = 10;
            }
            var chars = str.split('');
            var number = 0;
            var i = 0;
            if (x <= 10) {
                while (i < chars.length && chars[i] != '.') {
                    number *= x;
                    number += chars[i].codePointAt(0) - '0'.codePointAt(0);
                    i++
                }
                // jump the point
                if (chars[i] == '.') {
                    i++
                }
                var fraction = 1;
                while (i < chars.length) {
                    fraction /= x;
                    number += (chars[i].codePointAt(0) - '0'.codePointAt(0)) * fraction;
                    i++
                }
            } else if (x <= 16) {
                var hexTable = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15, };
                while (i < chars.length) {
                    number *= x;
                    number += hexTable[chars[i].toLowerCase()];
                    i++
                }
            }
            return number;
        }
```

```javascript
function convertNumberToString(num,base){
    if(num === 0 ) return '0';
    if(isNaN(num)) return NaN;
    const m= ['0','1','2','3','4','5','6','7','8','9','A','B',
                'C','D','E','F'];
    if(!base) {
        base =10; //default 10 base
    }
    let str = '';
    let integer = Math.floor(Math.abs(num));
    let decimals = Math.abs(num) - integer;
    while(integer >0) {
        str = m[integer % base] + str;
        integer = Math.floor(integer /base);
    }
    let d_len=1;
    if(decimals >0) {
        str+='.';
        let n = Math.abs(num);
        while(n-Math.floor(n)>0){
            n= n*(Math.pow(base,d_len));
            d_len++;
        }  
    }
    while(decimals > 0){
        str+= m[Math.floor(decimals * base)];
        decimals = (decimals * base - Math.floor(decimals * base)).toFixed(d_len+1);
    }
    return num>0?str:"-"+str;
}
}
```