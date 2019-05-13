const fs = require('fs')
const path = require('path')
const R = require('ramda')

const { DrkBx } = require('./DarkBox/index')

const rootData = 'Testing\\'

const cnctRootEsp = R.map(file => rootData + file)

const omitFls = R.without( cnctRootEsp( ['Personal_TBL_MAVI.esp'] ) )

const print = value => {
    console.log(value)
    return value
}

const fileIsEmpty = R.pipe(
    fs.readFileSync,
    R.toString
)

const toEsp = R.pipe(
    path.parse,
    R.prop('name'),
    R.replace(/_MAVI/gi, ''),
    DrkBx.mix.change.lastLowScriptToPoint,
    R.replace(DrkBx.mix.patt.pthExt, R.toLower)
)

const verifyAndToEsp = paths => (DrkBx.intls.patt.abbrtObjBtwnLowScripts)
    ? toEsp(paths) : DrkBx.mix.cls.pthRoot(paths).replace(/(\_|\.).*/g, '')

const delEmpty = path => {
    // console.log('delete: ', fileIsEmpty(path))
    if (fileIsEmpty(path) == '') {
        console.log('delete: ', path)
        fs.unlinkSync(path)
        return ''
    } else {
        return path
    }
}

const espFiltFls = R.pipe(
    DrkBx.mix.fls.getFiltFls,
    omitFls,
    R.map(delEmpty),
    R.filter(Boolean)
)

const cmpToObj = cmp => R.objOf( DrkBx.intls.take.cmpHead(cmp), DrkBx.intls.fnObj.fldsToObj(cmp) )
const cmpToObjWithBrakets = cmp => R.objOf('[' + DrkBx.intls.take.cmpHead(cmp) + ']', DrkBx.intls.fnObj.fldsToObj(cmp) )

const uniqObjs = array => {
    const newObj = {}
    array.forEach(x => Object.assign(newObj, R.mergeDeepRight(newObj, x)))
    return newObj
}

const gtUniqCmpsOutSide = R.pipe(
    DrkBx.intls.take.cmpOutSide,
    R.filter(Boolean),
    R.map(cmpToObj),
    uniqObjs,
    DrkBx.intls.fnObj.cmpsToTxt,
)

const rootEsp = '../../../Intelisis/Intelisis5000/Reportes MAVI\\'
const rootOrig = '../../../Intelisis/Intelisis5000/Codigo Original\\'

const proccessFile = pathFile => {
    return gtUniqCmpsOutSide( verifyAndToEsp(pathFile), DrkBx.mix.fls.gtLtnTxt(pathFile) )
}

const nameFile = cmp => DrkBx.intls.newPath.espToMavi(DrkBx.intls.take.cmpNameFile(cmp).join(''))

const addIndex = cmp => R.objOf(nameFile(cmp), cmpToObj(cmp))

const isntExstCreate = (comps, key) => {
    if (comps.length != 0) {
        if (!DrkBx.mix.fls.exist('Testing\\' + key)) {
            fs.writeFileSync('Testing\\' + key, 'Reacomodo:\n\n')
        }
    }
    return comps
}

const addCmp = R.curry( (comp, text) => {
    // console.log(comp)
    if (DrkBx.intls.fnCmp.checkExstHeadCmpInTxt(comp,text)) {
        text = DrkBx.intls.fnCmp.addCmpExst(comp, text)
    }
    else {
        text = DrkBx.intls.fnCmp.addCmpInexst(comp,text)
    }
    // console.log(text)
    return text
})

const addCmps = R.curry( (comps, nameFile) => {
    let text = DrkBx.mix.fls.gtLtnTxt('Testing\\' + nameFile)
    comps.forEach(comp => {
        text = addCmp(comp, text)
    })
    // fs.writeFileSync('Testing\\' + key, text, 'Latin1')
    return text
})


const clean = path => {
    if (DrkBx.intls.make.outSide(DrkBx.intls.newPath.maviToEsp(path)).test(DrkBx.mix.fls.gtLtnTxt(path))) {
        fs.writeFileSync(path, DrkBx.intls.cls.outSide(DrkBx.intls.newPath.maviToEsp(path), DrkBx.mix.fls.gtLtnTxt(path)), 'Latin1')
        return path
    } else {
        return path
    }
}

const delIfHasntCmp = path => {
    if (DrkBx.intls.fnCmp.hasntComp(DrkBx.mix.fls.gtLtnTxt(path))) {
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
    R.map(DrkBx.intls.fnObj.cmpsToTxt),
    R.forEachObjIndexed(isntExstCreate),
    R.mapObjIndexed(addCmps),
    R.forEachObjIndexed( (text, path) => fs.writeFileSync('Testing\\' +path, text, 'Latin1')),
)

const combine = path => {
    // console.log(path)
    // if ( delEmpty(path) ) {
        lols(path)
        lsjd(path)
        // console.log(delIfHasntCmp(path))
    // }
    // clean(path)
    // 
}

espFiltFls('.esp', rootData).forEach(file => {
    combine(file)
})
// espFiltFls('.esp', rootData)
// combine('Testing\\ActivoFCat_FRM_MAVI.esp')