fetch('https://global-warming.org/api/temperature-api')
  .then((res) => res.json())
  .then((json) => {
    console.log('records', json.result.length)
    console.log('last', json.result.at(-1))
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
