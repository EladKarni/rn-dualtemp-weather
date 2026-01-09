import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { WidgetPreview } from 'react-native-android-widget';

export function HelloWidgetPreviewScreen(props: { widget: React.ComponentType }) {
    return (
        <View style={styles.container}>
            <WidgetPreview
                renderWidget={() => <props.widget />}
                width={320}
                height={200}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});