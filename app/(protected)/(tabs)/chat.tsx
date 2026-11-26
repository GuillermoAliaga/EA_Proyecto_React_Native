import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Socket } from 'socket.io-client';
import { Header } from '../../../src/components/layout/Header';
import { useAuth } from '../../../src/context/AuthContext';
import { useTheme } from '../../../src/context/ThemeContext';
import type { Activity } from '../../../src/models';
import { getActivities } from '../../../src/services/activity.service';
import type { ChatMessage, ChatUser } from '../../../src/services/chat.service';
import {
  createChatSocket,
  getActivityRoom,
  getChatUsers,
  getDirectRoom,
} from '../../../src/services/chat.service';

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.room === 'string' &&
    typeof message.text === 'string' &&
    typeof message.timestamp === 'string' &&
    typeof message.user === 'object' &&
    message.user !== null &&
    typeof message.user._id === 'string' &&
    typeof message.user.name === 'string'
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function ChatScreen() {
  const { user, accessToken } = useAuth();
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<Activity[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsRetry, setContactsRetry] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [chatError, setChatError] = useState<string | null>(null);
  const [room, setRoom] = useState('general');
  const [roomTitle, setRoomTitle] = useState('Sala general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const activeRoomRef = useRef(room);
  const messageListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    activeRoomRef.current = room;
  }, [room]);

  useEffect(() => {
    const controller = new AbortController();
    setContactsLoading(true);
    setContactsError(null);
    void getChatUsers(controller.signal)
      .then((result) => setContacts(result.filter((contact) => contact._id !== user?._id)))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setContacts([]);
        setContactsError(
          error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setContactsLoading(false);
      });
    return () => controller.abort();
  }, [contactsRetry, user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    const controller = new AbortController();
    void getActivities({ limit: 100 }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setJoinedActivities(
          result.data.filter(
            (activity) =>
              !activity.deleted &&
              activity.participants.some((participant) => participant.userId === user._id),
          ),
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setJoinedActivities([]);
      });
    return () => controller.abort();
  }, [user?._id]);

  useEffect(() => {
    if (!accessToken) return;
    setConnectionStatus('connecting');
    const socket = createChatSocket(accessToken);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setChatError(null);
      socket.emit('chat:join', { room: activeRoomRef.current });
    });
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('connect_error', (error: Error) => {
      setConnectionStatus('error');
      setChatError(error.message || 'No se pudo conectar al chat.');
    });
    socket.on('users:online', (ids: unknown) => {
      if (Array.isArray(ids) && ids.every((id) => typeof id === 'string')) {
        setOnlineIds(ids);
      }
    });
    socket.on('chat:history', (history: unknown) => {
      if (!Array.isArray(history) || !history.every(isChatMessage)) {
        setChatError('El servidor devolvió un historial de chat no válido.');
        return;
      }
      setMessages(history.filter((message) => message.room === activeRoomRef.current));
    });
    socket.on('chat:message', (payload: unknown) => {
      if (!isChatMessage(payload)) return;
      if (payload.room !== activeRoomRef.current) return;
      setMessages((current) => {
        if (payload._id && current.some((message) => message._id === payload._id)) return current;
        return [...current, payload];
      });
    });
    socket.on('chat:error', (payload: unknown) => {
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string'
      ) {
        setChatError(payload.message);
      }
    });
    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  const joinRoom = useCallback((nextRoom: string, title: string) => {
    if (!nextRoom || nextRoom === activeRoomRef.current) return;
    activeRoomRef.current = nextRoom;
    setRoom(nextRoom);
    setRoomTitle(title);
    setMessages([]);
    setChatError(null);
    const socket = socketRef.current;
    if (socket?.connected) socket.emit('chat:join', { room: nextRoom });
  }, []);

  const openDirect = (contact: ChatUser) => {
    if (!user) return;
    joinRoom(getDirectRoom(user._id, contact._id), contact.name);
  };

  const openActivityRoom = (activity: Activity) =>
    joinRoom(getActivityRoom(activity._id), activity.title);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !connected) return;
    socketRef.current?.emit('chat:message', { room, text });
    setDraft('');
  };

  const onlineCount = onlineIds.length;
  const connected = connectionStatus === 'connected';

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.content}>
        <View style={styles.heading}>
          <Header title="Chat" subtitle="Conecta con la comunidad en tiempo real" />
          <View style={[styles.connection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: connected ? '#2e7d32' : connectionStatus === 'error' ? colors.danger : colors.textSecondary },
              ]}
            />
            <Text style={[styles.connectionText, { color: colors.textSecondary }]}>
              {connectionStatus === 'connected' ? 'Conectado' : connectionStatus === 'connecting' ? 'Conectando…' : connectionStatus === 'error' ? 'Error de conexión' : 'Desconectado'}
            </Text>
          </View>
        </View>

        <View style={[styles.contactsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.contactsHeading}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personas</Text>
            <Text style={[styles.onlineSummary, { color: colors.textSecondary }]}>
              {onlineCount} conectadas
            </Text>
          </View>
          {contactsError ? (
            <View style={styles.contactsError}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{contactsError}</Text>
              <Pressable onPress={() => setContactsRetry((current) => current + 1)}>
                <Text style={[styles.generalLink, { color: colors.primary }]}>Reintentar</Text>
              </Pressable>
            </View>
          ) : contactsLoading ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>Cargando usuarios...</Text>
          ) : contacts.length === 0 ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              No hay otros usuarios disponibles todavía.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contactList}
            >
              {contacts.map((contact) => {
                const contactRoom = user ? getDirectRoom(user._id, contact._id) : '';
                const selected = room === contactRoom;
                const isOnline = onlineIds.includes(contact._id);
                return (
                  <Pressable
                    key={contact._id}
                    accessibilityRole="button"
                    accessibilityLabel={`${contact.name}, ${isOnline ? 'conectado' : 'desconectado'}`}
                    accessibilityState={{ selected }}
                    onPress={() => openDirect(contact)}
                    style={[
                      styles.contact,
                      {
                        backgroundColor: selected ? colors.primary : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.presenceDot,
                        { backgroundColor: isOnline ? '#2e7d32' : colors.textSecondary },
                      ]}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.contactName,
                        { color: selected ? colors.surface : colors.text },
                      ]}
                    >
                      {contact.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={[styles.contactsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mis actividades ({joinedActivities.length})</Text>
          {joinedActivities.length === 0 ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>No estás inscrito en ninguna actividad todavía.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activityList}>
              {joinedActivities.map((activity) => {
                const activityRoom = getActivityRoom(activity._id);
                const selected = room === activityRoom;
                return (
                  <Pressable
                    key={activity._id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => openActivityRoom(activity)}
                    style={[
                      styles.activityRoom,
                      { backgroundColor: selected ? colors.primary : colors.background, borderColor: selected ? colors.primary : colors.border },
                    ]}
                  >
                    <Text numberOfLines={1} style={{ color: selected ? colors.surface : colors.text, fontWeight: selected ? '700' : '500' }}>
                      {activity.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.roomHeading}>
          <View style={[styles.roomMark, { backgroundColor: colors.primary }]} />
          <Text numberOfLines={1} style={[styles.roomTitle, { color: colors.text }]}>
            {roomTitle}
          </Text>
          {room !== 'general' ? (
            <Pressable onPress={() => joinRoom('general', 'Sala general')}>
              <Text style={[styles.generalLink, { color: colors.primary }]}>Sala general</Text>
            </Pressable>
          ) : null}
        </View>

        {chatError ? (
          <Text accessibilityLiveRegion="polite" style={[styles.errorText, { color: colors.danger }]}>
            {chatError}
          </Text>
        ) : null}

        <FlatList
          ref={messageListRef}
          style={styles.messages}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyMessages,
          ]}
          data={messages}
          keyExtractor={(item, index) => item._id ?? `${item.timestamp}-${item.user._id}-${index}`}
          onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const ownMessage = item.user._id === user?._id;
            return (
              <View
                style={[
                  styles.messageRow,
                  ownMessage ? styles.ownMessageRow : styles.otherMessageRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    ownMessage
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {!ownMessage ? (
                    <Text style={[styles.sender, { color: colors.primary }]}>{item.user.name}</Text>
                  ) : null}
                  <Text style={[styles.messageText, { color: ownMessage ? colors.surface : colors.text }]}>
                    {item.text}
                  </Text>
                  <Text
                    style={[
                      styles.timestamp,
                      { color: ownMessage ? colors.surface : colors.textSecondary },
                    ]}
                  >
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {connected
                ? 'Aún no hay mensajes. ¡Empieza la conversación!'
                : 'Conectando con el chat...'}
            </Text>
          }
        />

        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            accessibilityLabel="Escribe un mensaje"
            value={draft}
            onChangeText={setDraft}
            placeholder={`Escribe un mensaje en ${roomTitle}...`}
            maxLength={2000}
            placeholderTextColor={colors.textSecondary}
            editable={connected}
            style={[styles.messageInput, { color: colors.text }]}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            accessibilityState={{ disabled: !connected || !draft.trim() }}
            disabled={!connected || !draft.trim()}
            onPress={sendMessage}
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              (!connected || !draft.trim()) && styles.disabledSend,
            ]}
          >
            <Text style={[styles.sendLabel, { color: colors.surface }]}>Enviar</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, padding: 16, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  connection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 20,
  },
  connectionDot: { width: 8, height: 8, borderRadius: 4 },
  connectionText: { fontSize: 12, fontWeight: '600' },
  contactsPanel: { padding: 12, borderWidth: 1, borderRadius: 14, gap: 10 },
  contactsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactsError: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  onlineSummary: { fontSize: 12 },
  contactList: { gap: 8, paddingRight: 4 },
  contact: {
    maxWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 22,
  },
  presenceDot: { width: 8, height: 8, borderRadius: 4 },
  contactName: { flexShrink: 1, fontSize: 13, fontWeight: '600' },
  activityList: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  activityRoom: { maxWidth: 190, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 10 },
  roomHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomMark: { width: 10, height: 10, borderRadius: 5 },
  roomTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  generalLink: { fontSize: 13, fontWeight: '600' },
  messages: { flex: 1 },
  messagesContent: { flexGrow: 1, justifyContent: 'flex-end', gap: 8, paddingVertical: 4 },
  emptyMessages: { justifyContent: 'center' },
  messageRow: { width: '100%', flexDirection: 'row' },
  ownMessageRow: { justifyContent: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '84%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16, borderWidth: 1 },
  sender: { marginBottom: 3, fontSize: 12, fontWeight: '700' },
  messageText: { fontSize: 15, lineHeight: 20 },
  timestamp: { alignSelf: 'flex-end', marginTop: 4, fontSize: 10 },
  emptyText: { alignSelf: 'center', paddingHorizontal: 24, textAlign: 'center', fontSize: 14 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, padding: 6 },
  messageInput: { flex: 1, minHeight: 42, paddingHorizontal: 10, fontSize: 15 },
  sendButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 11 },
  disabledSend: { opacity: 0.5 },
  sendLabel: { fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 13 },
  errorText: { fontSize: 12 },
});
