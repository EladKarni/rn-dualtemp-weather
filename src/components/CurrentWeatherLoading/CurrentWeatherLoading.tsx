import React from 'react'
import Card from '../Card/Card'

type CurrentWeatherLoadingPropsType = {
    date: Date
}

const CurrentWeatherLoading = (props: CurrentWeatherLoadingPropsType) => {
    return (
        <Card date={props.date.toLocaleDateString()} />
    )
}

export default CurrentWeatherLoading