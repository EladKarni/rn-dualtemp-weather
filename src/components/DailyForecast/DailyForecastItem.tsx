import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { DailyEntity } from '../../types/WeatherTypes';
import { DailyForecastItemStyles } from './DailyForecast.Styles';
import Card, { CardStyleTypes } from '../Card/Card';
import moment from 'moment'
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { displayWeatherIcon } from '../../utils/Images';
import TempText, { TempTextStyleTypes } from '../TempText/TempText';

type DailyForecastItemPropTypes = {
    day: DailyEntity;
    index: number;
    currSelected: number;
    setSelected: (index: number) => void;
}

const DailyForecastItem = ({ day, index, setSelected, currSelected }: DailyForecastItemPropTypes) => {
    return (
        <Card cardType={index === currSelected ? CardStyleTypes.DAILYXL : CardStyleTypes.DAILY}>
            <TouchableOpacity onPress={() => setSelected(index)}>
                <View style={DailyForecastItemStyles.dailyItemHeader}>
                    <Text style={DailyForecastItemStyles.dayText}>{moment.unix(day.dt).format('dddd')}</Text>
                    <View style={DailyForecastItemStyles.tempIconContainer}>
                        <View style={DailyForecastItemStyles.tempContainer}>
                            <TempText
                                temp={day.temp.day}
                                textStyleType={TempTextStyleTypes.DAILY}
                                tempType='C'
                                withSym={false}
                            />
                            <Text style={DailyForecastItemStyles.tempDivider}> | </Text>
                            <TempText
                                temp={day.temp.day}
                                textStyleType={TempTextStyleTypes.DAILY}
                                tempType='F'
                                withSym={false}
                            />
                        </View>
                        <WeatherIcon icon={displayWeatherIcon(day.weather[0].icon)} iconSize={IconSizeTypes.SMALL} />
                    </View>
                </View>
                {index === currSelected &&
                    <View style={DailyForecastItemStyles.dailyItemExpanded}>
                        <View>
                            <Text style={DailyForecastItemStyles.descriptionText}>{day.weather[0].description}</Text>
                            <Text style={DailyForecastItemStyles.rainChancesText}>{`${day.pop * 100}% chance of rain`}</Text>
                            <View style={DailyForecastItemStyles.sunCycleContainer}>
                                <Text style={DailyForecastItemStyles.sunCycleText}>{`Sunrise: ${moment.unix(day.sunrise).format('H:mm')}`}</Text>
                                <Text style={DailyForecastItemStyles.sunCycleText}>{`Sunset: ${moment.unix(day.sunset).format('H:mm')}`}</Text>
                            </View>
                        </View>
                        <View style={DailyForecastItemStyles.expandedTempAreaContainer}>
                            <View style={DailyForecastItemStyles.sideBySideTempContainer}>
                                <Text style={DailyForecastItemStyles.sideBySideTempText}>Feels like</Text>
                                <TempText
                                    temp={day.feels_like.day}
                                    textStyleType={TempTextStyleTypes.DAILY}
                                    tempType='C'
                                    withSym={false}
                                />
                                <Text style={DailyForecastItemStyles.tempDivider}> | </Text>
                                <TempText
                                    temp={day.temp.day}
                                    textStyleType={TempTextStyleTypes.DAILY}
                                    tempType='F'
                                    withSym={false}
                                />
                            </View>
                            <View style={DailyForecastItemStyles.sideBySideTempContainer}>
                                <Text style={DailyForecastItemStyles.sideBySideTempText}>High of</Text>
                                <TempText
                                    temp={day.temp.max}
                                    textStyleType={TempTextStyleTypes.DAILY}
                                    tempType='C'
                                    withSym={false}
                                />
                                <Text style={DailyForecastItemStyles.tempDivider}> | </Text>
                                <TempText
                                    temp={day.temp.max}
                                    textStyleType={TempTextStyleTypes.DAILY}
                                    tempType='F'
                                    withSym={false}
                                />
                            </View>
                            <View style={DailyForecastItemStyles.sideBySideTempContainer}>
                                <Text style={DailyForecastItemStyles.sideBySideTempText}>Low of</Text>
                                <TempText
                                    temp={day.temp.min}
                                    textStyleType={TempTextStyleTypes.DAILY}
                                    tempType='F'
                                    withSym={false}
                                />
                                <Text style={DailyForecastItemStyles.tempDivider}> | </Text>
                                <TempText
                                    temp={day.temp.min}
                                    textStyleType={TempTextStyleTypes.DAILY}
                                    tempType='F'
                                    withSym={false}
                                />
                            </View>
                        </View>
                    </View>
                }
            </TouchableOpacity>
        </Card>
    )
}

export default DailyForecastItem