const fs = require('fs')
const path = require('path')
const R = require('ramda')

const patt = {
    //=> _FRM_
    abbrtObjBtwnLowScripts: /(?<=_)(dlg|frm|rep|tbl|vis)(?=_)/i,
    lastPointToLowScript: txt => txt.replace( /\.(?!.*?\.)/, '_'),
    ext: /\.\w{3}$/,
    untilExt: /.*?(?=\.\w+$)/,
    cmpNameFile: /(?<=^\[).*?(?=\/.*?\])/g,
}

const methods = {
    pthRoot: R.pipe(
        R.split(/[\\/]/),      // Divide por / o \ (para Windows y Linux)
        R.last                 // Toma el último segmento (el nombre del archivo)
    ),
    fldsToObj: R.pipe(
        take.fldFull,
        R.map(R.split(/=/))
    ),
    espToMavi: pathFile => {
            return patt.lastPointToLowScript(
                pathFile.replace(patt.ext, patt.allUntilExt(pathFile).toUpperCase())
            ) + '_MAVI.esp'
    },
    cmpsToTxt: R.pipe(
        R.map(R.toPairs),
        R.map(fldsToTxt),
        R.toPairs,
        R.map(R.join(']\n')),
        R.map(R.replace(/^/, '['))
    ),
    addCmpExst: R.curry( (exstCmp, txt) => {
        // console.log(mergCmpWithCmpInTxt(exstCmp, txt).join(''))
        return R.replace(
            cmpByNameNoAdapt(cmpHead(exstCmp)),
            mergCmpWithCmpInTxt(exstCmp, txt).join('') + '\n',
            txt
        )
    }),
    outSide: (nameFileInHead, txt) => {
        if (make.outSide(nameFileInHead).test(txt)) {
            return txt.replace(make.outSide(nameFileInHead), '')
        } else {
            return txt
        }
    },
    toRgxHeadComp: nameComp => new RegExp(`^\\[\\b${nameComp}\\b\\]`, `gm`),
    toRgxHeadCmp: R.pipe(this.cmpHead, this.toRgxHeadComp),
    checkExstHeadCmpInTxt: R.curry( (comp, txt) => R.test( toRgxHeadCmp(comp), txt )),
    existAndIsFile: R.both(fs.existsSync, isFl),
    allUntilExt: txt => txt.replace(patt.untilExt, ''),
    getLatinTxt: file => fs.readFileSync(file, 'Latin1'),
    getFiltFls: R.curry( (ext, files) => filterFiles( ext, getPathsFiles(files) ) ),
    cmpHead: txt => (patt.cmpHead.test(txt.replace(/^/, '\n'))) ? txt.replace(/^/, '\n').match(patt.cmpHead) : false,
    cmpNameFile: txt => patt.cmpNameFile.test(txt) && txt.match(patt.cmpNameFile),
    addCmpInexstInTxt: R.curry( (InxstCmp, txt) => {
        txt = txt + '\n' + InxstCmp + '\n'
        return txt
    })
}

const rootData = 'Testing\\'

const cnctRootEsp = R.map(file => rootData + file)

const omitFls = R.without( cnctRootEsp( ['Personal_TBL_MAVI.esp'] ) )

const fileIsEmpty = R.pipe(
    fs.readFileSync,
    R.toString
)

const toEsp = R.pipe(
    path.parse,
    R.prop('name'),
    R.replace(/_MAVI/gi, ''),
    lastLowScriptToPoint,
    R.replace(patt.ext, R.toLower)
)

const verifyAndToEsp = paths => (patt.abbrtObjBtwnLowScripts)
    ? toEsp(paths) : methods.pthRoot(paths).replace(/(\_|\.).*/g, '')

const delEmpty = path => {
    if (fileIsEmpty(path) == '') {
        console.log('delete: ', path)
        fs.unlinkSync(path)
        return ''
    } else {
        return path
    }
}

const espFiltFls = R.pipe(
    methods.getFiltFls,
    omitFls,
    R.map(delEmpty),
    R.filter(Boolean)
)

const cmpToObj = cmp => R.objOf( methods.cmpHead(cmp), methods.fldsToObj(cmp) )
const cmpToObjWithBrakets = cmp => R.objOf('[' + methods.cmpHead(cmp) + ']', methods.fldsToObj(cmp) )

const uniqObjs = array => {
    const newObj = {}
    array.forEach(x => Object.assign(newObj, R.mergeDeepRight(newObj, x)))
    return newObj
}

const gtUniqCmpsOutSide = R.pipe(
    methods.cmpOutSide,
    R.filter(Boolean),
    R.map(cmpToObj),
    uniqObjs,
    methods.cmpsToTxt,
)

const proccessFile = pathFile => {
    return gtUniqCmpsOutSide( verifyAndToEsp(pathFile), methods.getLatinTxt(pathFile) )
}

const nameFile = cmp => methods.espToMavi(methods.cmpNameFile(cmp).join(''))

const addIndex = cmp => R.objOf(nameFile(cmp), cmpToObj(cmp))

const isntExstCreate = (comps, key) => {
    if (comps.length != 0) {
        if (!methods.existAndIsFile('Testing\\' + key)) {
            fs.writeFileSync('Testing\\' + key, 'Reacomodo:\n\n')
        }
    }
    return comps
}

const addCmp = R.curry( (comp, text) => {
    if (methods.checkExstHeadCmpInTxt(comp,text)) {
        text = methods.addCmpExst(comp, text)
    }
    else {
        text = methods.addCmpInexst(comp,text)
    }
    return text
})

const addCmps = R.curry( (comps, nameFile) => {
    let text = methods.getLatinTxt('Testing\\' + nameFile)
    comps.forEach(comp => {
        text = addCmp(comp, text)
    })
    return text
})


const clean = path => {
    if (methods.outSide(methods.maviToEsp(path)).test(methods.getLatinTxt(path))) {
        fs.writeFileSync(path, methods.outSide(methods.maviToEsp(path), methods.getLatinTxt(path)), 'Latin1')
        return path
    } else {
        return path
    }
}

const delIfHasntCmp = path => {
    if (!/^\[.*?\]((\n|\r)(?!(\n|)^\[.+?\]).*?$)+/gm.test(methods.getLatinTxt(path))) {
        console.log('delete: ', path)
        fs.unlinkSync(path)
        return { file: path, Status: 'Delete'}
    } else {
        return { file: path, Status: 'HasComp'}
    }
}

const lsjd = R.pipe(
    clean,
    delIfHasntCmp
)

const lols = R.pipe(
    proccessFile,
    R.map(addIndex),
    uniqObjs,
    R.map(methods.cmpsToTxt),
    R.forEachObjIndexed(isntExstCreate),
    R.mapObjIndexed(addCmps),
    R.forEachObjIndexed( (text, path) => fs.writeFileSync('Testing\\' +path, text, 'Latin1')),
)

const combine = path => {
    lols(path)
    lsjd(path)
}

espFiltFls('.esp', rootData).forEach(file => {
    combine(file)
})

// espFiltFls('.esp', rootData)
// combine('Testing\\ActivoFCat_FRM_MAVI.esp')