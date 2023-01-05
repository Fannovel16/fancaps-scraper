module.exports = (arr, numOfParts) => {
    let re = []
    const eachPartAmount = Math.floor(arr.length / numOfParts) || 1
    for (let i = 0; i < numOfParts; i++) {
        const slice = arr.slice(eachPartAmount * i, eachPartAmount * (i + 1))
        if (slice.length === 0) break
        re.push(slice)
    }
    const remainLength = arr.length - (eachPartAmount * numOfParts)
    if (remainLength > 0) {
        for (let i = 0; i < remainLength; i++) {
            re[i].push(arr[eachPartAmount * numOfParts + i])
        }
    }
    return re
}