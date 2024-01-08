const widgetConfig = {
  // Paths to all custom fonts used in all widgets
  widgets: [
    {
      name: 'Hello', // This name will be the **name** with which we will reference our widget.
      label: 'My Hello Widget', // Label shown in the widget picker
      minWidth: '320dp',
      minHeight: '120dp',
      description: 'This is my first widget', // Description shown in the widget picker
      previewImage: './assets/widget-preview.png', // Path to widget preview image

      // How often, in milliseconds, that this AppWidget wants to be updated.
      // The task handler will be called with widgetAction = 'UPDATE_WIDGET'.
      // Default is 0 (no automatic updates)
      // Minimum is 1800000 (30 minutes == 30 * 60 * 1000).
      updatePeriodMillis: 1800000,
    },
  ],
};

export default ({ config }) => {
  const extra = {
    ...config.extra,
    eas: {
      projectId: "444bda66-1ab4-4665-ba53-c2b76743a33b"
    }
  };

  return {
    name: "DualTemp Weather",
    ...config,
    extra,
    plugins: [['react-native-android-widget', widgetConfig]],
  };
};