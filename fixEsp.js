const fs = require('fs')

const { adapt } = require('./Utilities/RegExp/adapt')
const cls = require('./Utilities/RegExp/cls')
const take = require('./Utilities/RegExp/take')

const code = require('./Utilities/Mix/Coding/codingFile')
const { fileExists } = require('./Utilities/Mix/Verify/fileExist')
const { getFiles } = require('./Utilities/Mix/PathWay/getFiles')
const { nameFile } = require('./Utilities/Intls/Components/nameFileInCmp')
const newPath = require('./Utilities/Intls/PathWay/newPath')
const supr = require('./Utilities/Mix/PathWay/deleteFile')

const { asComp } = require('./Utilities/Intls/Components/asComp')
const duplex = require('./Utilities/Mix/Array/duplicate')
const { isNewOrExistPro } = require('./Utilities/Intls/Fields/isNewOrExist')

const dir = 'Testing\\'
// const dir = 'C:\\Users\\lapena\\Documents\\Luis Angel\\Sección Mavi\\Intelisis\\Intelisis5000\\Reportes MAVI\\'

function proccesComponentExist(comp, pathFile) {

    let headNewComp = take.intls.comp.head(comp)

    if(headNewComp) {

        let newCompFields = take.intls.field.full(comp)

        if (newCompFields) {
            let crashFields = []
            newCompFields.forEach(fieldSend => {

                let olderComp = take.intls.comp.byName(
                    headNewComp.join(''),
                    code.getTxtInOriginCoding(pathFile).replace(/^\n+/gm, '\n')
                )

                if (olderComp) {

                    olderComp =  duplex.del(olderComp)

                    if (olderComp.length != 0) {
                        if (!isNewOrExistPro(fieldSend, olderComp.join('\n'))) {
                           
                            let rgxAddField = new RegExp(`(?<=\\[\\b${adapt.toRegExp(headNewComp.join(''))}\\b\\])`,`g`)

                            fs.appendFileSync('Reporte.txt','\n\nExist Comp: [' + headNewComp.join('') + ']')
                            fs.appendFileSync('Reporte.txt','\nNew Field In Exist Comps: \n' + fieldSend)
                           
                            fs.writeFileSync(pathFile, code.getTxtInOriginCoding(pathFile).replace(rgxAddField, '\n' + fieldSend), 'latin1')
                
                        } else {
                            crashFields.push(fieldSend)
                        }
                    }
                }
            })
            if (crashFields) {
                if (crashFields.length != 0) {

                    fs.appendFileSync('Reporte.txt','\nColition fields: \n' + crashFields)
                
                    let colitiontext = `\n;Campos Colisionados\n;[${headNewComp.join('')}]\n${crashFields.map(x => x.replace(/^/, ';')).join('\n') + '\n'}`
                    
                    fs.appendFileSync(pathFile, colitiontext)
                    
                }
            }
        }
    }
}

function proccesComponentNotExist(comp, headNewComp, pathFile){

    fs.appendFileSync(pathFile, '\n[' + headNewComp + ']\n')

    let newCompFields = take.intls.field.full(comp)

    fs.appendFileSync('Reporte.txt','\n\nAdd New Comp: \n[' + headNewComp + ']')

    if (newCompFields) {

        let colition = []
        newCompFields.forEach(field => {
            if (new RegExp (`^${take.intls.field.name(field)}=`, `gm`).test(
                    take.intls.comp.byName(
                        headNewComp,
                        code.getTxtInOriginCoding(pathFile).replace(/^\n+/gm, '\n')
                    ).join(''))
                ) {

                colition.push(field)
            } else {
                fs.appendFileSync('Reporte.txt', '\n' + field)
                fs.appendFileSync(pathFile, field + '\n')
            }
        })

        if (colition) {
            if (colition.length != 0) {
                fs.appendFileSync('Reporte.txt','Colition fields: \n' + colition)
                let textToSend =  `\n;Campos Colisionados\n;[${headNewComp}]\n${colition.map(x => x.replace(/^/, ';')).join('\n') + '\n'}`
                fs.appendFileSync(pathFile,textToSend)
            }
        }
    }
    // console.log('\nFinish Content: \n',code.getTxtInOriginCoding(pathFile), '\n-------------------')
}

function addComponent(compsOutSide, nameFile, pathFile) {

    let newComps = take.intls.comp.byNameFile(nameFile, compsOutSide.join('\n'))

    newComps.forEach(comp => {

        let headNewComp = take.intls.comp.head(comp)

        if(headNewComp) {

            let rgxHead = new RegExp(`^\\[\\b${adapt.toRegExp(headNewComp.join(''))}\\b\\]`, `gm`)

            if (!rgxHead.test(code.getTxtInOriginCoding(pathFile))) {
                proccesComponentNotExist(comp, headNewComp.join(''), pathFile)
            } else {
                proccesComponentExist(comp, pathFile)
            }
        }
    })
}

function oddComponent(comp, pathFile) {

    let headNewComp = take.intls.comp.head(comp)
    // console.log(headNewComp)
    if(headNewComp) {

        let rgxHead = new RegExp(`^\\[\\b${adapt.toRegExp(headNewComp.join(''))}\\b\\]`, `gm`)

        if (!rgxHead.test(code.getTxtInOriginCoding(pathFile))) {
            proccesComponentNotExist(comp, headNewComp.join(''), pathFile)
        } else {
            proccesComponentExist(comp, pathFile)
        }
    }

}

getFiles(dir, ['.esp'])
    .then(files => {

        files.forEach(file => {

            if (file != dir + 'Personal_TBL_MAVI.esp') {
                // if (file == dir + 'ActivarDesafectar.esp' || file == dir + 'MonederoElectronico.esp'|| file == dir + 'UEN.esp'|| file == dir + 'ArtConDisponible_ANEXO_MAVI.esp'||file == dir + 'VentaT_Mayor12Meses.esp'||file == dir + 'EliminarConta.esp') {
                if (supr.deleteEmptyFile(file)) {
                    return
                } else {
                    let pathEsp = newPath.maviToEsp(file)

                    let txt = code.getTxtInOriginCoding(file)

                    if (pathEsp){
                        fs.appendFileSync('Reporte.txt',
                                '\n************************************\n' 
                                + pathEsp
                                + '\n************************************'
                            )
                        let compsOutSide = take.intls.comp.outSide(pathEsp, cls.intls.comments(txt))

                        if (compsOutSide) {
                            
                            compsOutSide.forEach(outComp => {
                                // console.log(outComp)
                                fs.appendFileSync('Reporte.txt',
                                    '\n\n-------------------------'
                                    + 'Comp OutSide:\n'
                                    + outComp
                                    +'\n-------------------'
                                )
                                let nameFileInCmp = nameFile(outComp)
                                console.log('nameFileInCmp: ',nameFileInCmp)
                                // let namesFiles = duplex.del(nameFileInComp(compsOutSide))
                                
                                // if (namesFiles) {

                                //     namesFiles.forEach(nameFile => {

                                //         if (nameFile) {
    
                                let newPathComp = newPath.espToMavi(nameFileInCmp)
                                // console.log('newPathComp: ',newPathComp)
                                if (!fileExists(dir + newPathComp)) {
                                    fs.appendFileSync('Reporte.txt','\nCreate file: ' + newPathComp)
                                    fs.writeFileSync(dir + newPathComp, ';*** 22-03-19 Reacomodo de los archivos especiales\n', 'latin1')
                                //     addComponent(compsOutSide, nameFile, dir + newPathComp)
                                } else {
                                    fs.appendFileSync('Reporte.txt','\nExist File: ' + newPathComp)
                                }
                                
                                oddComponent(outComp, dir + newPathComp)
                                // addComponent(compsOutSide, nameFile, dir + newPathComp)


                                            

                                //         }
                                //     })
                                // }
                                fs.writeFileSync(file, cls.intls.comp.outSide(pathEsp, txt), 'latin1')

                            })
                            if (!asComp(file)) {
                                fs.appendFileSync('Reporte.txt',
                                    '\n_______________'
                                    + '\nNo Comp: Delete: ' 
                                    + file.replace(/.*\/|.*\\/, '')
                                    +'\n_______________'
                                )
                                fs.unlinkSync(file)
                            }
                        }
                    }
                }
                //}
            }
        })
    })
    .catch(e => console.error(e))
