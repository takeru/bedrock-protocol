const { EventEmitter } = require('events')
const dgram = require('dgram');

// https://wiki.vg/Raknet_Protocol

class LanGameFinder extends EventEmitter {
    constructor (options) {
      super()
      this._options = options || {}
    }

    start(){
        if(this._socket){
            throw "already running"
        }
        const socket = dgram.createSocket('udp4');
        this._socket = socket;

        socket.on('listening', () => {
            const address = socket.address();
            // console.log('UDP socket listening on ' + address.address + ":" + address.port);
            this.emit("start", address);
        });
        socket.on("error", (err)=>{
            this.emit("error")
        });
        socket.on("close", ()=>{
            this.emit("close")
        })

        socket.on('message', (message, remote) => {
            // console.log(remote.address + ':' + remote.port + " - "+ message.length);
            const packet_id = message[0]
            // console.log(remote.address + ':' + remote.port, "packet_id=", packet_id, "length=", message.length)
            if(packet_id == 1){
                const time = message.readBigInt64BE(1) // 8
                const magic = message.subarray(9,25) // 16
                const client_guid = message.readBigInt64BE(25) // 8
                // console.log("  UnconnectedPing", time, magic, client_guid)
                socket.send(message, 0, message.length, remote.port, remote.address, (err, bytes) => {
                    if (err) throw err;
                });
            } else if(packet_id == 28){ // 0x1C
                const time = message.readBigInt64BE(1) // 8
                const server_guid = message.readBigInt64BE(9) // 8
                const magic = message.subarray(17,33) // 16
                if(35<=message.length){
                    const len = message.readUint16BE(33)
                    const server_id_string = message.subarray(35, 35+len).toString('utf-8')
                    // console.log("  UnconnectedPong", time, server_guid, magic, len, server_id_string)
                    // MCPE;bouchan;545;1.19.21;1;5;12390867814740695306;tetsu hori robot land;Survival;1;54191;51625;0;
                    const parts = server_id_string.split(";")
                    const edition = parts[0]
                    const motd_line_1 = parts[1]
                    const protocol_version = parts[2]
                    const version_name = parts[3]
                    const player_count = parts[4]
                    const max_player_count = parts[5]
                    const server_unique_id = parts[6]
                    const motd_line_2 = parts[7]
                    const game_mode = parts[8]
                    const game_mode_numeric = parts[9]
                    const port_ipv4 = parts[10]
                    const port_ipv6 = parts[11]
                    const xxx_what_is_this_xxx = parts[12]
                    // console.log("  " + motd_line_1 + " " + motd_line_2 + " " + version_name + " " + remote.address + ":" + port_ipv4)
                    this.emit("found", {
                        "motd_line_1": motd_line_1,
                        "motd_line_2": motd_line_2,
                        "version_name": version_name,
                        "addr": remote.address,
                        "port": port_ipv4,
                        "_server_id_string": server_id_string
                    })
                }
            }
        });
        socket.bind(19132, this._options["address"] || "0.0.0.0")
    }

    stop(){
        if(this._socket){
            this._socket.close()
            this._socket = null;
        }
    }
}

module.exports = { LanGameFinder }
