const fs = require('fs')
let rem = require('./remote.js')
let reload = require('require-reload')(require);
const rl = require('readline').createInterface({
    input:process.stdin,
    output:process.stdout
})

rl.setPrompt('/>')
rl.prompt()
rl.on('line', (line) => {
    line = line.split(' ')
    if (line[0] === 'quit') process.exit()
    actionSwitch(line)
    rem = reload('./remote.js')
    rl.prompt()
})


const repository = {
    // 파일 형식 : hello: [{power: true}, {power: ['time', 'repo','status','fileName']}]
}
const stagingArea = []
const gitRepository = []
let ptr = ""

function actionSwitch(line){
    if (line[0] === 'init'){
        if (repository[line[1]] === undefined) {
            console.log(line[1] + " 저장소를 생성했습니다.")
            repository[line[1]] = [{}, {}]
        }
        else console.log("같은 이름의 저장소가 있습니다.")
    }

    else if (line[0] === 'status'){
        if (line[1] === 'remote'){
            
            if (line[2] === undefined){
                const repoSet = new Set()
                for (let i = 0; i < rem.length; i++){
                    repoSet.add(rem[i][1]['repo'])
                }
                for (let repo of repoSet){
                    console.log(repo + '/')
                }
            }

            else {
                let last = rem.length - 1;

                while (last >= 0) {
                    if (rem[last][1]['repo'] === line[2]) break;
                    last--;
                }
                if (last < 0 || isNaN(last)) {
                    console.log("해당 저장소 내역이 없습니다.")
                }
                else {
                    console.log(`last commit ${rem[last][0]}`)
                    for (let i = 1; i < rem[last].length; i++) {

                        console.log(rem[last][i]['name'] + '  ' + rem[last][i]['time'])
                    }
                }
            }
        }

        else if (line[1] === 'local' || ptr === ""){
            try {
                const keys = Object.keys(repository[line[2]][1])
                if (keys.length === 0) throw Error
                for (let i = 0; i < keys.length; i++)
                    console.log(repository[line[2]][1][keys[i]][3] + '  ' + repository[line[2]][1][keys[i]][0])
                
            } catch (e) {
                console.log("전체 저장소 목록")
                const keys = Object.keys(repository)
                for (key in keys) console.log(keys[key])
            }
        }



        else {
            console.log("---Working Directory/")
            for (key in repository[ptr][0]){
                if (repository[ptr][1][key][2] === 'Untracked' || repository[ptr][1][key][2] === 'Modified')
                    console.log(key + '  ' + repository[ptr][1][key][0])
            }

            console.log("---Staging Directory/")
            for (let i = 0; i < stagingArea.length; i++){
                const tmp = Object.values(stagingArea[i])
                console.log(tmp[3] + '  ' + tmp[0])
            }

            console.log("---Git Repository/")
            for (let i = 0; i < gitRepository.length; i++){
                const tmp = Object.values(gitRepository[i])
                console.log(tmp[0])
                for (let j = 1; j < tmp.length; j++){
                    console.log(tmp[j]['name'] + '  ' + tmp[j]['time'])
                }
            }
        }
    }

    else if (line[0] === 'checkout'){
        if (repository[line[1]] !== undefined){
            ptr = line[1]
            rl.setPrompt('/' + line[1] + '/>')
        }
        else {
            ptr = ""
            rl.setPrompt('/>')
        }
    }

    else if (line[0] === 'new') {
        if (ptr === "") {
            console.log("저장소를 먼저 선택하세요.")
        }
        else if (line[1] === undefined) console.log("파일 이름을 입력하세요.")
        else {
            if (repository[ptr][0][line[1]] === undefined) {
                repository[ptr][0][line[1]] = true
                repository[ptr][1][line[1]] = [timeToString(), ptr, 'Untracked', line[1]]
            }
            else console.log("같은 이름의 파일이 존재합니다.")
        }
    }

    else if (line[0] === 'add') {
        try {
            if (repository[ptr][1][line[1]][2] !== 'Unmodified') {
                repository[ptr][1][line[1]][2] = 'Staged'
                stagingArea.push(repository[ptr][1][line[1]])
                console.log("---Staging Directory/")
                for (let i = 0; i < stagingArea.length; i++){
                    const tmp = Object.values(stagingArea[i])
                    console.log(tmp[3] + '  ' + tmp[0])
                }
            }
            else console.log("수정된 내용이 없습니다.")
        }
        catch(e){
            console.log("파일을 찾을 수 없습니다.")
        }
    }

    else if (line[0] === 'commit'){
        let msg = "", temp = []
        for (let i = 1; i < line.length; i++) msg = msg + line[i] + ' '
        msg = msg.trim()
        temp.push(msg)
        console.log("---commit files/")
        for (let i = 0; i < stagingArea.length; i++){
            const tmp = Object.values(stagingArea[i])

            let commitFile = {}
            commitFile['time'] = tmp[0];
            commitFile['repo'] = tmp[1];
            commitFile['status'] = 'Unmodified'
            commitFile['name'] = tmp[3]
            temp.push(commitFile)
            
            repository[ptr][1][tmp[3]][2] = 'Unmodified'

            console.log(tmp[3] + '  ' + tmp[0])
        }
        gitRepository.push(temp)
        while(stagingArea.length !== 0) stagingArea.pop()
    }

    else if (line[0] === 'touch'){
        try {
            if (repository[ptr][1][line[1]][2] === 'Unmodified') {
                repository[ptr][1][line[1]][2] = 'Modified'
                repository[ptr][1][line[1]][0] = timeToString()
            }
            else console.log("커밋 기록이 없습니다.")
        }
        catch(e){
            console.log("파일을 찾을 수 없습니다.")
        }
    }
    
    else if (line[0] === 'log'){
        console.log("---Git Repository/")
        for (let i = 0; i < gitRepository.length; i++){
            const tmp = Object.values(gitRepository[i])
            console.log(tmp[0])
            for (let j = 1; j < tmp.length; j++){
                console.log(tmp[j]['name'] + '  ' + tmp[j]['time'])
            }
        }
    }

    else if (line[0] === 'push'){
        console.log("push some commits...")
        for (let i = 0; i < gitRepository.length; i++){
            console.log("commit " + gitRepository[i][0] + " pushed")
        }

        const data = "const remote = " + JSON.stringify(gitRepository)
        

        fs.writeFile('./remote.js', data + "\nmodule.exports = remote", (err)=>{
            console.log("Saved")
        })
        
    }

}

function timeToString(){
    const time = new Date()
    const YY = zeroAdd(time.getFullYear())
    const MM = zeroAdd(time.getMonth() + 1)
    const DD = zeroAdd(time.getDate())
    const hour = zeroAdd(time.getHours())
    const min = zeroAdd(time.getMinutes())
    const sec = zeroAdd(time.getSeconds())
    return `${YY}-${MM}-${DD} ${hour}:${min}:${sec}`
    
}

function zeroAdd(num){
    if (num - 0 < 10) return '0' + num
    return num
}
