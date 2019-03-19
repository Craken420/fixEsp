const fs = require('fs')

const add = require('./Utilities/RegExp/add')
const cls = require('./Utilities/RegExp/cls')
const take = require('./Utilities/RegExp/take')

const code = require('./Utilities/Mix/Coding/codingFile')
const duplex = require('./Utilities/Mix/Array/duplicate')
const editFile = require('edit-file')
const newPath = require('./Utilities/Intls/PathWay/newPath')
const supr = require('./Utilities/Mix/PathWay/deleteFile')

const { fileExists } = require('./Utilities/Mix/Verify/fileExist')
const { getFiles } = require('./Utilities/Mix/PathWay/getFiles')
const { isNewOrExist } = require('./Utilities/Intls/Fields/isNewOrExist')
const { nameFileInComp } = require('./Utilities/Intls/Components/nameFileInCmp')

const dir = 'Testing\\'

getFiles(dir, ['.esp'])
    .then(files => {

        files.forEach(file => {

            supr.deleteEmptyFile(file)

            let pathEsp = newPath.maviToEsp(file)

            let txt = code.getTxtInOriginCoding(file)

            let compsOutSide = take.intls.comp.outSide(pathEsp, cls.intls.comments(txt))

            if (compsOutSide) {

                let namesFiles = duplex.del(nameFileInComp(compsOutSide))

                if (namesFiles) {
                    namesFiles.forEach(nameFile => {

                        let newPathComp = newPath.espToMavi(nameFile)
                        let newComps = take.intls.comp.byNameFile(nameFile,compsOutSide.join('\n'))

                        if (fileExists(dir + newPathComp)) {

                            editFile(dir + newPathComp, text => {

                                newComps.forEach(newComp => {

                                    let headNewComp = take.intls.comp.head(newComp)

                                    if(headNewComp) {

                                        let newCompFields = take.intls.field.full(newComp)

                                        if (newCompFields) {

                                            let olderComp = take.intls.comp.byName(
                                                headNewComp.join(''),
                                                code.getTxtInOriginCoding(dir + newPathComp).replace(/^\n+/gm, '\n')
                                            )

                                            if (olderComp) {

                                                olderComp =  duplex.del(olderComp)

                                                if (olderComp.length != 0) {
                                                    //que solo devuelta true si existe y false si no
                                                    let lol = isNewOrExist(newCompFields, olderComp[0])

                                                    if (lol['newField']) {
                                                        if (lol['newField']!= 0) {
                                                            text = add.intls.comp.addInTheEnd(headNewComp, '\n' + lol['newField'].join('\n'), text)
                                                        }
                                                    }

                                                    // if (lol['crashField']) {
                                                    //     if (lol['crashField']!= 0) {
                                                    //         text = text.replace(/$/, `\n;Campos Colisionados\n;[${headNewComp}]\n${lol['crashField'].join('\n').replace(/^/g, ';')}`)
                                                    //     }
                                                    // }
                                                }
                                            }
                                        }
                                    }
                                })
                                return text
                            })
                        } else {
                            // console.log('Creado: ',dir + key)
                            // fs.writeFileSync(dir + newPathComp, newComps.join(\n))
                        }
                    })
                }
            }
        })
    })
    .catch(e => console.error(e))