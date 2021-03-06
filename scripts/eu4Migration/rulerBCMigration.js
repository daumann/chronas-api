const fetch = require('node-fetch')
const fs = require('fs')
const resolve = require('path').resolve
// const LineReader = require('linereader')
const folderDir = resolve("../../dataToMigrate/extendedtimeline/history/countries")
const colorFolderDir = resolve("../../dataToMigrate/extendedtimeline/common/countries")
const properties = {
  chronasApiHost: 'http://localhost:4040/v1',
  flagFolder: '/images/icons/ruler/'
}

const utils = require('../utils')

function extractValueByKeyandEnd({ line, startString, stopString }) {
  const nameIndex = line.indexOf(startString)
  const startStringLength = startString.length
  if (line.indexOf(startString) > -1) {
    // look for entity name
    const endIndex = line.substr(nameIndex + startStringLength).indexOf(stopString)
    return line.substr(nameIndex + startStringLength, (endIndex === -1) ? 10000 : endIndex)
  }
  return false
}

function getFirstNumberOfLine({line}) {
  const potentialYear = line.substr(0, line.indexOf('.'))
  if (potentialYear.match(/^-{0,1}\d+$/)) {
    return +potentialYear
  }
  return false
}

getColor = (fileName) => new Promise((resolve, reject) => {
  const moddedFileName = fileName.replace(/ and /g, "").replace(/ of /g, "Of").replace(/ /g, "")
  console.debug(moddedFileName+'.txt')
  const lineReader2 = new LineReader(colorFolderDir + '/' + moddedFileName + '.txt')
  lineReader2.on('line', function (lineno, line) {
      // look for entity name
      const potentialName = extractValueByKeyandEnd({line, startString: 'color = { ', stopString: ' }'})
      if (potentialName) return resolve("rgb(" + potentialName.split('  ').join(',') + ")")
  })
  lineReader2.on('end', function () {
    resolve(false)
  })
  lineReader2.on('error', function () {
    console.debug("-----!!! color error with file " + fileName)
    resolve(false)
  })
})

handleFile = (fileName) => new Promise((resolve, reject) => {
    const lineReader = new LineReader(folderDir + '/' + fileName)

    let entityId = fileName.substr(0, fileName.indexOf(" - "))
    let entityName = fileName.substring(fileName.indexOf(" - ")+3, fileName.length-4)


    let start = false // first number
    let end = false // lastnumber
    let attacker = []
    let defender = []

    lineReader.on('line', function (lineno, line) {
      if (!entityName) {
        // look for entity name
        const potentialName = extractValueByKeyandEnd({line, startString: 'name = "', stopString: '"' })
        if (potentialName) entityName = potentialName
      }

      // const potentialAttacker = extractValueByKeyandEnd({line, startString: 'add_attacker = ', stopString: ' ' })
      // if (potentialAttacker && !attacker.includes(potentialAttacker)) attacker.push(potentialAttacker)
      // const potentialDefender = extractValueByKeyandEnd({line, startString: 'add_defender = ', stopString: ' ' })
      // if (potentialDefender && !defender.includes(potentialDefender)) defender.push(potentialDefender)


      if (!start) {
        // look for start date
        const potentialYear = getFirstNumberOfLine({line})
        if (potentialYear !== false) {
          start = potentialYear
          end = potentialYear
        }
      }

      const potentialYear = getFirstNumberOfLine({line})
      if (potentialYear !== false) {
        end = potentialYear
      }
    });

    lineReader.on('end', function () {

      // console.debug(entityId, "###", entityName)
      // console.debug("start___" + start)
      // console.debug("end___" + end)
      //
      // if (attacker.length === 0 || defender.length === 0) {
      //   console.debug("XXXXXXXXXXXXXXXXXX no participants, fileName: " + fileName)
      // }
      //
      // if (!entityName) {
      //   console.debug("!!!!!!!XXXXXX entityName not found, fileName: " + fileName)
      //   return resolve()
      // }

      utils.getEnWikiBySearch(entityName)
        .then((enWiki) => {
          if (!enWiki) {
            console.debug("!!!!!!! enwiki not found for entityName: " + entityName)
            return resolve()
          }

          getColor(entityName)
            .then((ccolor) => {
              if (!ccolor) {
                console.debug("!!!!!!! ccolor not found for: " + entityName)
                return resolve()
              }

                // console.debug({[entityId]: [
                //   entityName,
                //   ccolor,
                //   enWiki,
                //   properties.flagFolder + entityId + ".png"
                // ]})
                return resolve()
            })
            .catch((err) => {
              console.debug("22 ERRRRRRRRRROR", err, fileName)
              return resolve()
            })
          // console.debug(JSON.stringify(epicObjectToPost))

          // console.debug(".")
/*
          fetch(`${properties.chronasApiHost}/metadata`, {
            method: 'POST',
            body: JSON.stringify(epicObjectToPost),
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJAa2V5c3RvbmVqcy5jb20iLCJ1c2VybmFtZSI6ImRpenp5LXdhc3RlIiwibGFzdFVwZGF0ZWQiOiIyMDE4LTAzLTAyVDE5OjE3OjI0LjU2M1oiLCJwcml2aWxlZ2UiOjEsImlhdCI6MTUyMDM5NzcwMX0.o4PX-DUixjEWOqUKyhL3F2ck4DJI6zKfmuc-0YvMERU'
            },
          })
            .then((response) => {
              if (response.status < 200 || response.status >= 300) {
                console.log('metadata failed', response.status, entityName, JSON.stringify(epicObjectToPost))
                return resolve()
              } else {
                console.log('metadata added')
                return resolve()
              }
            })
            .catch((err) => {
              // console.debug("ERRRRRRRRRROR", err, fileName)
              return resolve()
            })
*/

        })
        .catch((err) => {
          console.debug("ERRRRRRRRRROR", err, fileName)
          return resolve()
        })
    });
})

// Loop through all the files in the temp directory
fs.readdir(folderDir, function( err, files ) {
  if (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }

  files.reduce(
    (p, x) => p.then((_) => {
      return handleFile(x)
    }),
    Promise.resolve()
  )
})
