//
let execSync = require('child_process').execSync;

/**
 * Finding free port synchronously
 * @param {Object} options [description]
 */
function FindFreePortSync(options = {}) {
    this.defaultOptions = {
        // port start for scan
        start: 1,
        // port end for scan
        end: 65534,
        // ports number for scan
        num: 1,
        // specify ip for scan
        ip: '0.0.0.0|127.0.0.1',
        // for inner usage, some platforms like darkwin shows commom address 0.0.0.0:10000 as *.10000
        port: null
    };

    this.msg = {
        error: 'Cannot find free port'
    }

    this.adjustOptions(options);
}

FindFreePortSync.prototype = {
    constructor: FindFreePortSync,

    /**
     * Produce a correct options
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    adjustOptions(options) {
        if (typeof options.start !== 'undefined') {
            options.start = parseInt(options.start, 10);
            options.start = (isNaN(options.start)
                || options.start < this.defaultOptions.start
                || options.start > this.defaultOptions.end
            ) ? this.defaultOptions.start : options.start;
        }

        if (typeof options.end !== 'undefined') {
            options.end = parseInt(options.end, 10);
            options.end = (isNaN(options.end)
                || options.end < this.defaultOptions.start
                || options.end > this.defaultOptions.end
            ) ? this.defaultOptions.end : options.end;
        }

        if (options.start > options.end) {
            let temp = options.start;
            options.start = options.end;
            options.end = temp;
        }

        options.num = isNaN(parseInt(options.num)) ? this.defaultOptions.num : parseInt(options.num);
        Object.assign(this, this.defaultOptions, options);
    },

    /**
     * Get random number
     * @return {[type]} [description]
     */
    getRandomPort() {
        return Math.floor(Math.random() * (this.end - this.start) + this.start);
    },

    /**
     * Find free port
     * @return {[type]} [description]
     */
    getPort() {
        let stepIndex = 0;
        let maxStep = 65536
        let freePort = null
        let res = ''
        let portSplitStr = '.'
        let ipReg = this.ip.replace(/\./g, '\\.') + '|'
        let reg = new RegExp(`\\s(${ipReg}0\\.0\\.0\\.0|127\\.0\\.0\\.1|\\*)[\\:\\.](\\d+).*(LISTEN|ESTABLISHED)`, 'g')
        let regIpAndPort = new RegExp(`(${ipReg}0\\.0\\.0\\.0|127\\.0\\.0\\.1|\\*)[\\:\\.](\\d+)`, 'g')
        try {
            // get network state list
            res = execSync('netstat -an', {
                encoding: 'utf-8'
            });
            usedPorts = res.match(reg);
            if (usedPorts) {
              usedPorts = usedPorts.join('').match(regIpAndPort)
              if (usedPorts[0].indexOf(':') > -1) {
                portSplitStr = ':'
              }
            }
            usedPorts = !usedPorts ? [] : usedPorts.map(item => {
                let ipList = item.split(portSplitStr);
                let port = ipList[ipList.length - 1]
                return parseInt(port, 10)
            });

            // check the port if usage and return directly
            if (this.port) {
              return !usedPorts.includes(this.port) ? false : (this.port >= this.start && this.port <= this.end);
            }

            usedPorts = [...new Set(usedPorts)];

            // get a random free port
            if (this.num === 1) {
                let portAvaliable = false;

                while (!portAvaliable) {
                    freePort = this.getRandomPort();

                    if (!usedPorts.includes(freePort)) {
                        portAvaliable = true;
                    }

                    if (++stepIndex > maxStep) {
                        console.log(this.msg.error);
                    }

                    return freePort;
                }
            }

            // return free ports orderly
            freePort = [];

            for (let i = this.end, n = 1; i >= this.start; --i) {
              if (!usedPorts.includes(i)) {
                if (n++ > this.num) {
                  continue;
                }
                freePort.push(i);
              }
            }

            if (!freePort.length) {
                console.log(this.msg.error);
            }

            return freePort;

        } catch(e) {
            console.log(this.msg.error);
            console.log(e);
        }

        return freePort;
    }
}

module.exports = FindFreePortSync;
