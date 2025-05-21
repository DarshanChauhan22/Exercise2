import React, { useState, useEffect, useMemo, useContext, createContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useHeaderHeight } from '@react-navigation/elements';

const MessageDataContext = createContext(null);

const I1 = require('./assets/i1.png');
const I2 = require('./assets/i2.png');
const I3 = require('./assets/i3.png');
const I4 = require('./assets/i4.png');
const I5 = require('./assets/i5.png');
const I6 = require('./assets/i6.png');

const rawInitialDirectoriesData = [
  {
    id: 'you',
    name: 'Vin',
    icon: I1,
    color: '#FF6347',
    messages: [
      { id: 'msg1', text: 'Remember to take a break today!' },
      { id: 'msg2', text: 'You are making great progress on your project.' },
    ],
  },
  {
    id: 'home',
    name: 'Brain',
    icon: I2,
    color: '#87CEEB',
    messages: [
      { id: 'msg3', text: 'Grocery shopping list: milk, eggs, bread.' },
      { id: 'msg4', text: 'Pay the internet bill by Friday.' },
    ],
  },
  {
    id: 'love',
    name: 'Tezz',
    icon: I3,
    color: '#DC143C',
    messages: [
      { id: 'msg5', text: 'Plan a date night for this weekend.' },
      { id: 'msg6', text: 'Write a sweet note.' },
    ],
  },
  {
    id: 'family',
    name: 'Sam',
    icon: I4,
    color: '#6A5ACD',
    messages: [
      { id: 'msg7', text: 'Call mom on Sunday afternoon.' },
      { id: 'msg8', text: 'Coordinate family dinner for next month.' },
    ],
  },
  {
    id: 'friends',
    name: 'Jason',
    icon: I5,
    color: '#FFC0CB',
    messages: [
      { id: 'msg9', text: "Respond to Sarah's message about the movie." },
      { id: 'msg10', text: 'Organize a board game night.' },
    ],
  },
  {
    id: 'school',
    name: 'Latty',
    icon: I6,
    color: '#00CED1',
    messages: [
      { id: 'msg11', text: 'CS5450 Exercise 2 deadline approaching!' },
      { id: 'msg12', text: 'Review notes for the upcoming quiz.' },
    ],
  },
];

const screenWidth = Dimensions.get('window').width;

const numColumns = Platform.OS === 'web' ? 3 : 2; 
const listHorizontalPadding = 10 * 2; 
const interItemSpace = 10; 
const totalSpacingForGaps = (numColumns - 1) * interItemSpace;
const baseItemWidth = (screenWidth - listHorizontalPadding - totalSpacingForGaps) / numColumns;


let iconCircleDiameter = baseItemWidth * 0.7; 

if (Platform.OS === 'web') {
  const MAX_WEB_ICON_DIAMETER = numColumns === 3 ? 120 : 150; 
  iconCircleDiameter = Math.min(iconCircleDiameter, MAX_WEB_ICON_DIAMETER);
}

const DirectoryScreen = ({ navigation }) => {
  const messageData = useContext(MessageDataContext);
  if (!messageData) {
    return (
      <View>
        <Text>Loading context...</Text>
      </View>
    );
  }
  const { directories } = messageData;

  if (!directories) {
    return (
      <View style={[styles.directoryContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading directories...</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.directoryItem, { width: baseItemWidth }]}
      onPress={() => {
        navigation.navigate('Messages', {
          directoryId: item.id,
          directoryName: item.name,
          color: item.color,
        });
      }}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
        <Image source={item.icon} style={styles.icon} />
      </View>
      <Text style={styles.directoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.directoryContainer}>
      <FlatList
        data={directories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns} 
        contentContainerStyle={styles.directoryList}
      />
    </View>
  );
};

const MessagesScreen = ({ route }) => {
  const { directoryId, directoryName, color } = route.params;

  const messageData = useContext(MessageDataContext);
  if (!messageData) {
    return (
      <View>
        <Text>Loading context...</Text>
      </View>
    );
  }
  const {
    messages: allMessagesFromApp,
    directories: allDirectories,
    addMessageToList: addMessageCallback,
    deleteMessageFromList: deleteMessageCallback,
  } = messageData;

  const [input, setInput] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    if (directoryId) {
      setSelectedRecipientId(directoryId);
    }
  }, [directoryId]);

  const displayedMessages = useMemo(() => {
    if (!allMessagesFromApp || !directoryId) return [];
    return allMessagesFromApp
      .filter(msg => msg.senderId === directoryId || msg.recipientId === directoryId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [allMessagesFromApp, directoryId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const onSend = () => {
    if (!input.trim()) {
      Alert.alert('Empty Message', 'Please enter some text to send.');
      return;
    }
    if (!selectedRecipientId) {
      Alert.alert('No Recipient', 'Please select a recipient.');
      return;
    }
    if (typeof addMessageCallback !== 'function') {
      console.error("MessagesScreen: addMessageCallback is not a function!");
      Alert.alert('Error', 'Cannot send message.');
      return;
    }
    const newMessage = {
      id: `msg${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: input.trim(),
      senderId: directoryId,
      recipientId: selectedRecipientId,
      timestamp: Date.now()
    };
    addMessageCallback(newMessage);
    setInput('');
  };

  const handleDeleteMessage = (messageId) => {
    if (typeof deleteMessageCallback !== 'function') {
      console.error("MessagesScreen: deleteMessageCallback is not a function!");
      Alert.alert('Error', 'Cannot delete message.');
      return;
    }
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMessageCallback(messageId) }
      ]
    );
  };

  const renderMessage = ({ item }) => {
    if (!allDirectories) {
      return (
        <View>
          <Text>Error rendering message details.</Text>
        </View>
      );
    }
    const isMyMessage = item.senderId === directoryId;
    const sender = allDirectories.find(d => d.id === item.senderId);
    const recipient = allDirectories.find(d => d.id === item.recipientId);
    const lightColors = ['#FFC0CB', '#87CEEB', '#FFDEAD', '#90EE90', '#ADD8E6'];
    const useDarkText = color && lightColors.some(lightColor => color.toUpperCase() === lightColor.toUpperCase());
    const messageTextColor = isMyMessage ? (useDarkText ? '#000000' : '#FFFFFF') : '#333333';
    const subTextColor = isMyMessage ? (useDarkText ? '#333333' : '#E0E0E0') : '#555555';
    const timestampColor = isMyMessage ? (useDarkText ? '#555555' : '#F5F5F5') : '#888888';

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        <View style={[styles.messageItem, isMyMessage ? { backgroundColor: color || '#DCF8C6' } : styles.otherMessage]}>
          {!isMyMessage && sender && (
            <Text style={[styles.messageSenderName, { color: subTextColor }]}>
              From: {sender.name}
            </Text>
          )}
          {isMyMessage && recipient && item.recipientId !== directoryId && (
            <Text style={[styles.messageRecipientName, { color: subTextColor }]}>
              To: {recipient.name}
            </Text>
          )}
          {isMyMessage && recipient && item.recipientId === directoryId && (
            <Text style={[styles.messageRecipientName, { color: subTextColor }]}>
              Note to Self
            </Text>
          )}
          <Text style={[styles.messageText, { color: messageTextColor }]}>
            {item.text}
          </Text>
          <Text style={[styles.timestampText, { color: timestampColor }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteMessage(item.id)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!allDirectories || typeof allMessagesFromApp === 'undefined' || !directoryId || !directoryName) {
    return (
      <SafeAreaView style={styles.messageScreenSafeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading message data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentRecipientNameForPlaceholder = selectedRecipientId && allDirectories
    ? allDirectories.find(d => d.id === selectedRecipientId)?.name
    : directoryName;

  return (
    <SafeAreaView style={styles.messageScreenSafeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            data={displayedMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            extraData={allMessagesFromApp}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No messages in {directoryName || 'this directory'} yet.
                </Text>
              </View>
            )}
          />
        </View>
        <View style={[styles.inputAreaContainer, { paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 8) }]}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRecipientId}
              onValueChange={(itemValue) => setSelectedRecipientId(itemValue)}
              style={styles.recipientPicker}
              itemStyle={styles.pickerItem}
              prompt={`Send from ${directoryName || 'current directory'} to?`}
            >
              <Picker.Item label="Select recipient..." value={null} style={styles.pickerItemLabel} enabled={false} />
              {allDirectories.map(dir => (
                <Picker.Item key={dir.id} label={dir.name || 'Unknown Directory'} value={dir.id} style={styles.pickerItemLabel} />
              ))}
            </Picker>
          </View>
          <View style={styles.inputBar}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={`Message ${currentRecipientNameForPlaceholder || '...'} via ${directoryName || '...'}`}
              style={styles.textInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={onSend}
              blurOnSubmit={true}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: color || '#CCCCCC' },
                (!selectedRecipientId || !input.trim()) && styles.sendButtonDisabled
              ]}
              onPress={onSend}
              disabled={!selectedRecipientId || !input.trim()}
            >
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Stack = createStackNavigator();

const App = () => {
  const [directoriesData] = useState(
    rawInitialDirectoriesData.map(d => ({ id: d.id, name: d.name, icon: d.icon, color: d.color }))
  );
  const [messagesData, setMessagesData] = useState(
    rawInitialDirectoriesData.flatMap((dir, dirIndex) =>
      dir.messages.map((msg, msgIndex) => ({
        ...msg,
        senderId: dir.id,
        recipientId: dir.id,
        timestamp: Date.now() - (rawInitialDirectoriesData.length - dirIndex + 1) * 1000000 - (dir.messages.length - msgIndex + 1) * 10000,
      }))
    ).sort((a, b) => a.timestamp - b.timestamp)
  );

  const addMessageToList = (newMessage) => {
    setMessagesData(prevMessages => [...prevMessages, newMessage].sort((a, b) => a.timestamp - b.timestamp));
  };

  const deleteMessageFromList = (messageId) => {
    setMessagesData(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
  };

  const contextValue = {
    messages: messagesData,
    directories: directoriesData,
    addMessageToList,
    deleteMessageFromList,
  };

  return (
    <MessageDataContext.Provider value={contextValue}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Directories"
            screenOptions={{
              headerStyle: { backgroundColor: '#6A5ACD' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          >
            <Stack.Screen
              name="Directories"
              component={DirectoryScreen}
              options={{ title: 'Message Directories' }}
            />
            <Stack.Screen
              name="Messages"
              component={MessagesScreen}
              options={({ route }) => ({
                title: `${route.params?.directoryName || 'Messages'} Messages`,
                headerStyle: { backgroundColor: route.params?.color || '#6A5ACD' }
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </MessageDataContext.Provider>
  );
};

const styles = StyleSheet.create({
  directoryContainer: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  directoryList: {
    padding: 10, 
  },
  directoryItem: {
    margin: 5, 
    alignItems: 'center',
    paddingVertical: 15,
  },
  iconCircle: {
    width: iconCircleDiameter,
    height: iconCircleDiameter,
    borderRadius: iconCircleDiameter / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  icon: {
    width: '70%',
    height: '70%',
    resizeMode: 'contain',
  },
  directoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  messageScreenSafeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    maxWidth: '90%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    minWidth: 80,
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
  },
  messageSenderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  messageRecipientName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestampText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
    opacity: 0.8,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 5,
    marginRight: 5,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#FF3B30',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  inputAreaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  pickerContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
  },
  recipientPicker: {
    height: Platform.OS === 'ios' ? 120 : 50,
    width: '100%',
  },
  pickerItem: {
    height: Platform.OS === 'ios' ? 120 : undefined,
  },
  pickerItemLabel: {
    fontSize: 16,
    color: '#333',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 40,
    maxHeight: 120,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginRight: 10,
  },
  sendButton: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default App;