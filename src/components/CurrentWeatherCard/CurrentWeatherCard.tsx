import React, { useRef, useState, useEffect } from 'react';
import { View, PanResponder, Animated, Text } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import { WeatherEntity } from '../../types/WeatherTypes';
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { TempTextStyleTypes } from '../TempText/TempText';
import Card, { CardStyleTypes } from '../Card/Card';

import { CurrentWeatherStyles } from './CurrentWeatherCard.Styles'
import CardHeader from '../CardHeader/CardHeader';
import CardFooter from '../CardFooter/CardFooter';
import DualTempText from '../TempText/DualTempText';
import { useLocationStore } from '../../store/useLocationStore';
import { logger } from '../../utils/logger';

type CurrentWeatherPropsType = {
    temp: number;
    weather: WeatherEntity;
}

const CurrentWeather = ({ temp, weather }: CurrentWeatherPropsType) => {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const pan = useRef(new Animated.ValueXY()).current;

    // Get the latest values directly from the store for display
    const savedLocations = useLocationStore((state) => state.savedLocations);
    const activeLocationId = useLocationStore((state) => state.activeLocationId);
    const setActiveLocation = useLocationStore((state) => state.setActiveLocation);

    // Store a ref to get fresh values inside panResponder callbacks
    const storeRef = useRef({
        savedLocations,
        activeLocationId,
        setActiveLocation
    });

    // Update ref on every render
    useEffect(() => {
        storeRef.current = {
            savedLocations,
            activeLocationId,
            setActiveLocation
        };
    });

    const currentIndex = savedLocations.findIndex(loc => loc.id === activeLocationId);
    const hasMultipleLocations = savedLocations.length > 1;

    // Reset pan position when location changes (fixes second swipe issue)
    useEffect(() => {
        logger.debug('CurrentWeather: activeLocationId changed to:', activeLocationId);
        // Only reset if not currently animating (prevents mid-animation flicker)
        if (!isTransitioning) {
            pan.setValue({ x: 0, y: 0 });
        }
    }, [activeLocationId, isTransitioning]);

    const handleSwipe = (direction: 'next' | 'prev') => {
        // Get FRESH values from ref instead of closure
        const { savedLocations: freshLocations, activeLocationId: freshActiveId, setActiveLocation: freshSetActive } = storeRef.current;

        logger.group(`CurrentWeather.handleSwipe(${direction})`);
        logger.debug('Locations count:', freshLocations.length);

        const freshCurrentIndex = freshLocations.findIndex(loc => loc.id === freshActiveId);
        const freshHasMultiple = freshLocations.length > 1;

        logger.debug('Current index:', freshCurrentIndex);
        logger.debug('Active location:', freshActiveId);

        if (!freshHasMultiple) {
            logger.debug('Single location - showing bounce animation');
            // Bounce animation if only one location
            Animated.sequence([
                Animated.timing(pan, {
                    toValue: { x: direction === 'next' ? -20 : 20, y: 0 },
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: true,
                }),
            ]).start();
            logger.groupEnd();
            return;
        }

        setIsTransitioning(true); // Prevent multiple swipes

        const nextIndex = direction === 'next'
            ? (freshCurrentIndex + 1) % freshLocations.length
            : (freshCurrentIndex - 1 + freshLocations.length) % freshLocations.length;

        const nextLocation = freshLocations[nextIndex];

        logger.debug('Next index:', nextIndex);
        logger.debug('Next location:', nextLocation);

        // Step 1: Animate card off screen
        Animated.timing(pan, {
            toValue: { x: direction === 'next' ? -400 : 400, y: 0 },
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            logger.debug('Animation complete - changing location to:', nextLocation.id);
            // Step 2: Change location AFTER animation completes (use fresh ref)
            freshSetActive(nextLocation.id);

            // Step 3: Clear offset and position card off-screen on opposite side
            pan.flattenOffset();  // Clear the offset from gesture to prevent incorrect positioning
            pan.setValue({ x: direction === 'next' ? 400 : -400, y: 0 });

            // Step 4: Slide new card in
            Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                tension: 65,     // Faster initial movement
                friction: 10,    // Controlled deceleration
                useNativeDriver: true,
            }).start(() => {
                logger.debug('Slide in complete');
                setIsTransitioning(false); // Allow next swipe
                logger.groupEnd();
            });
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                if (isTransitioning) return false; // Prevent swipe during transition
                return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
            },
            onPanResponderGrant: (_, gestureState) => {
                pan.setOffset({ x: gestureState.dx, y: 0 });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x }],
                { useNativeDriver: false }  // Must be false for PanResponder - native driver doesn't support direct gesture tracking
            ),
            onPanResponderRelease: (_, gestureState) => {
                pan.flattenOffset();
                const SWIPE_THRESHOLD = 50;

                if (gestureState.dx > SWIPE_THRESHOLD) {
                    handleSwipe('prev');
                } else if (gestureState.dx < -SWIPE_THRESHOLD) {
                    handleSwipe('next');
                } else {
                    // Bounce back if didn't swipe far enough
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Animated.View
            style={{
                transform: [{ translateX: pan.x }],
                position: 'relative',
            }}
            {...(hasMultipleLocations ? panResponder.panHandlers : {})}
        >
            <Card cardType={CardStyleTypes.MAIN} >
                <CardHeader />
                <View style={CurrentWeatherStyles.mainArea}>
                    <WeatherIcon icon={displayWeatherIcon(weather?.icon)} iconSize={IconSizeTypes.LARGE} disc={weather.description} />
                    <View style={CurrentWeatherStyles.tempArea}>
                        <DualTempText
                            temp={temp}
                            tempStyleC={TempTextStyleTypes.MAIN}
                            tempStyleF={TempTextStyleTypes.SECONDARY}
                            degree
                        />
                    </View>
                </View>
                {hasMultipleLocations && (
                    <View style={CurrentWeatherStyles.locationIndicator}>
                        <Text style={CurrentWeatherStyles.indicatorText}>
                            {currentIndex + 1} / {savedLocations.length}
                        </Text>
                    </View>
                )}
                <CardFooter />
            </Card>

            {/* Loading overlay removed per user preference - no darkening effect */}
        </Animated.View>
    )
};

export default CurrentWeather;