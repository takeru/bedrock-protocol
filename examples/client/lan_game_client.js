/* eslint-disable */

process.env.DEBUG = 'minecraft-protocol raknet'

const target_game_name = "てつほりロボットランド"
const my_username = "てつほりくん"

function main(){
  find_lan_game((lan_game)=>{
    connect_to_lan_game(lan_game)
  })
}

function find_lan_game(cb){
  const { LanGameFinder } = require("./lan_game_finder")
  const lan_game_finder = new LanGameFinder()
  lan_game_finder.on("found", (lan_game)=>{
    if(lan_game["motd_line_2"] == target_game_name){
      lan_game_finder.stop()
      cb(lan_game)
    }
  })
  lan_game_finder.start();
}

function connect_to_lan_game(lan_game){
  const bedrock = require('bedrock-protocol')
  const client = bedrock.createClient({
    host: lan_game["addr"],
    port: parseInt(lan_game["port"]),
    username: my_username,
    offline: true,
  })
  client.on('text', (packet) => { // Listen for chat messages and echo them back.
    if (packet.source_name != client.username) {
      client.queue('text', {
        type: 'chat', needs_translation: false, source_name: client.username, xuid: '', platform_chat_id: '',
        message: `${packet.source_name} said: ${packet.message} on ${new Date().toLocaleString()}`
      })
    }
  })
}

main()