export const loadedImages = {
    clearSkyDay: require('../../assets/Images/01d.png'),
    clearSkyNight: require('../../assets/Images/01n.png'),

    fewCloudsDay: require('../../assets/Images/02d.png'),
    fewCloudsNight: require('../../assets/Images/02n.png'),
    
    scatteredClouds: require('../../assets/Images/03d.png'),

    brokenBlouds: require('../../assets/Images/04d.png'),
    
    showerRain: require('../../assets/Images/04d.png'),
    
    rainDay: require('../../assets/Images/10d.png'),
    rainNight: require('../../assets/Images/10n.png'),
    
    thunderstorm: require('../../assets/Images/11d.png'),
    
    snow: require('../../assets/Images/13d.png'),
    
    mist: require('../../assets/Images/50d.png'),
}

export const displayWeatherIcon = (icon: string) => {
    switch (icon) {
        case '01d':
            return loadedImages.clearSkyDay
        case '01n':
            return loadedImages.clearSkyNight

        case '02d':
            return loadedImages.fewCloudsDay
        case '02n':
            return loadedImages.fewCloudsNight

        case '03d':
        case '03n':
            return loadedImages.scatteredClouds

        case '04d':
        case '04n':
            return loadedImages.brokenBlouds

        case '09d':
        case '09n':
            return loadedImages.showerRain

        case '10d':
            return loadedImages.rainDay
        case '10n':
            return loadedImages.rainNight

        case '11d':
        case '11n':
            return loadedImages.thunderstorm
            
        case '13d':
        case '13n':
            return loadedImages.snow
                
        case '50d':
        case '50n':
            return loadedImages.mist

        default:
            return loadedImages.clearSkyDay
    }

}