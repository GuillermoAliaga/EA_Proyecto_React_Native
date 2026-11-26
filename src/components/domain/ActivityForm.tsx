import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { Activity, ActivityInput, Modality } from '../../models/activity.model';
import { MODALITIES } from '../../models/activity.model';
import { ApiError } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getCategories } from '../../services/category.service';
import type { CategoryOption } from '../../services/category.service';
import { initializeDefaultCategories } from '../../services/category.service';
import { createActivity, getActivity, updateActivity } from '../../services/activity.service';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { ErrorView, LoadingView } from '../ui/StateViews';
import { Header } from '../layout/Header';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { categoryLabel, subcategoryLabel } from '../../utils/category-labels';

interface ActivityFormProps {
  activityId?: string;
}

interface PhotonFeature {
  geometry?: { coordinates?: unknown };
  properties?: Record<string, unknown>;
}

interface AddressSuggestion {
  label: string;
  coordinates: [number, number];
}

type DateTarget = 'start' | 'end';
type DateMode = 'date' | 'time';

function getDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function mergeDatePart(current: Date, selected: Date, mode: DateMode): Date {
  const merged = new Date(current);
  if (mode === 'date') {
    merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
  } else {
    merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
  }
  return merged;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function photonAddress(properties: Record<string, unknown>): string {
  const street = [
    asText(properties.housenumber),
    asText(properties.street) || asText(properties.name),
  ]
    .filter(Boolean)
    .join(' ');
  const city =
    asText(properties.city) ||
    asText(properties.locality) ||
    asText(properties.district) ||
    asText(properties.county);
  return [street, city, asText(properties.country)].filter(Boolean).join(', ');
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function ActivityForm({ activityId }: ActivityFormProps) {
  const editing = Boolean(activityId);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null);
  const [categoriesMissing, setCategoriesMissing] = useState(false);
  const [initializingCategories, setInitializingCategories] = useState(false);
  const [categoryLoadAttempt, setCategoryLoadAttempt] = useState(0);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [modality, setModality] = useState<Modality>('CASUAL');
  const [address, setAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isStoreLocation, setIsStoreLocation] = useState(false);
  const [startTime, setStartTime] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [endTime, setEndTime] = useState(() => new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [minParticipants, setMinParticipants] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [price, setPrice] = useState('0');
  const [datePicker, setDatePicker] = useState<{ target: DateTarget; mode: DateMode } | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const debouncedAddress = useDebounce(address, 350);
  const selectedCategory = useMemo(
    () => categories.find((item) => item.slug === category),
    [categories, category],
  );

  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingCategories(true);
    setCategoryLoadError(null);
    void (async () => {
      try {
        const result = await getCategories(controller.signal);
        if (controller.signal.aborted) return;

        const activeCategories = result.filter((item) => !item.deleted);
        setCategories(activeCategories);
        if (activeCategories.length === 0) {
          setCategoriesMissing(true);
          setCategoryLoadError(
            'Todavía no hay opciones configuradas. Un administrador puede cargar las opciones iniciales para continuar.',
          );
          return;
        }
        setCategoriesMissing(false);
        setCategoryLoadError(null);
        if (!activityId) {
          setCategory((prev) => prev || activeCategories[0].slug);
          if (activeCategories[0].subcategories.length > 0) {
            setSubcategory((prev) => prev || activeCategories[0].subcategories[0].slug);
          }
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setCategories([]);
        setCategoriesMissing(false);
        setCategoryLoadError(
          error instanceof Error ? error.message : 'No se pudieron cargar las categorías.',
        );
      } finally {
        if (!controller.signal.aborted) setLoadingCategories(false);
      }
    })();
    return () => controller.abort();
  }, [activityId, categoryLoadAttempt]);

  const loadInitialCategories = async () => {
    if (user?.role !== 'ADMIN' || initializingCategories) return;
    setInitializingCategories(true);
    setLoadingCategories(true);
    setCategoryLoadError(null);
    try {
      const loadedCategories = await initializeDefaultCategories();
      const activeCategories = loadedCategories.filter((item) => !item.deleted);
      setCategories(activeCategories);
      if (activeCategories.length === 0) {
        setCategoriesMissing(true);
        setCategoryLoadError('El backend no confirmó la carga de las opciones iniciales.');
        return;
      }
      setCategoriesMissing(false);
      setCategory(activeCategories[0].slug);
      setSubcategory(activeCategories[0].subcategories[0]?.slug ?? '');
      showToast('Opciones iniciales cargadas desde el backend.');
    } catch (error: unknown) {
      setCategoryLoadError(
        error instanceof ApiError && error.status > 0
          ? `HTTP ${error.status}: ${error.message}`
          : error instanceof Error
            ? error.message
            : 'No se pudieron cargar las opciones iniciales.',
      );
    } finally {
      setInitializingCategories(false);
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (!activityId) return;
    const controller = new AbortController();
    setLoadingActivity(true);
    void getActivity(activityId, controller.signal)
      .then((result) => {
        setActivity(result);
        setTitle(result.title);
        setDescription(result.description);
        setCategory(result.category.toUpperCase());
        setSubcategory(result.subcategory.toUpperCase());
        setModality(result.modality);
        setAddress(result.location.addressName);
        setSelectedAddress(result.location.addressName);
        setCoordinates(result.location.coordinates);
        setIsStoreLocation(Boolean(result.location.isStoreLocation));
        setStartTime(getDate(result.schedule.startTime, new Date()));
        setEndTime(getDate(result.schedule.endTime, new Date(Date.now() + 60 * 60 * 1000)));
        setMinParticipants(String(result.capacity.minParticipants));
        setMaxParticipants(String(result.capacity.maxParticipants));
        setPrice(String(result.pricing.price));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : 'No se pudo cargar la actividad.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingActivity(false);
      });
    return () => controller.abort();
  }, [activityId, loadAttempt]);

  useEffect(() => {
    const query = debouncedAddress.trim();
    if (query.length < 3 || query === selectedAddress) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setSuggestionError(null);
      return;
    }

    const controller = new AbortController();
    setLoadingSuggestions(true);
    setSuggestionError(null);
    void fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error(`Photon respondió con estado ${response.status}.`);
        return (await response.json()) as { features?: PhotonFeature[] };
      })
      .then((result) => {
        const found = (result.features ?? [])
          .map((feature) => {
            const rawCoordinates = feature.geometry?.coordinates;
            const properties = feature.properties;
            if (
              !Array.isArray(rawCoordinates) ||
              typeof rawCoordinates[0] !== 'number' ||
              typeof rawCoordinates[1] !== 'number' ||
              !properties
            ) {
              return null;
            }
            const label = photonAddress(properties);
            return label
              ? {
                  label,
                  coordinates: [rawCoordinates[0], rawCoordinates[1]] as [number, number],
                }
              : null;
          })
          .filter((item): item is AddressSuggestion => item !== null);
        setSuggestions(found);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setSuggestionError(
          error instanceof Error ? error.message : 'No se pudo buscar la dirección.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSuggestions(false);
      });

    return () => controller.abort();
  }, [debouncedAddress, selectedAddress]);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setSelectedAddress(null);
    setCoordinates(null);
    setSuggestions([]);
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      if (Platform.OS === 'android') setDatePicker(null);
      return;
    }
    if (selected && datePicker) {
      const current = datePicker.target === 'start' ? startTime : endTime;
      const updated = mergeDatePart(current, selected, datePicker.mode);
      if (datePicker.target === 'start') setStartTime(updated);
      else setEndTime(updated);
    }
    if (Platform.OS === 'android') setDatePicker(null);
  };

  const failValidation = (message: string) => {
    setFormError(message);
    Alert.alert('Revisa los datos', message);
  };

  const handleSubmit = async () => {
    const minCount = minParticipants.trim() ? Number(minParticipants) : undefined;
    const maxCount = Number(maxParticipants);
    const activityPrice = price.trim() ? Number(price.replace(',', '.')) : undefined;

    if (!title.trim() || !description.trim()) {
      failValidation('El título y la descripción son obligatorios.');
      return;
    }
    if (!category || !subcategory) {
      failValidation('Selecciona una categoría y una subcategoría.');
      return;
    }
    const validCategory = categories.find((item) => item.slug === category);
    if (!validCategory?.subcategories.some((item) => item.slug === subcategory)) {
      failValidation('La categoría o subcategoría seleccionada ya no está activa en el backend. Actualiza las categorías e inténtalo de nuevo.');
      return;
    }
    if (address.trim().length < 2 || address.trim().length > 200) {
      failValidation('La dirección debe tener entre 2 y 200 caracteres.');
      return;
    }

    const hasValidCoordinates = Boolean(
      coordinates &&
      coordinates.length === 2 &&
      coordinates.every((coordinate) => Number.isFinite(coordinate)) &&
      coordinates[0] >= -180 && coordinates[0] <= 180 &&
      coordinates[1] >= -90 && coordinates[1] <= 90,
    );
    if (coordinates && !hasValidCoordinates) {
      failValidation('Las coordenadas deben estar dentro del rango válido de longitud y latitud.');
      return;
    }

    if (endTime.getTime() <= startTime.getTime()) {
      failValidation('La fecha y hora de fin debe ser posterior al inicio.');
      return;
    }
    if (minCount !== undefined && (!Number.isInteger(minCount) || minCount < 1)) {
      failValidation('El aforo mínimo debe ser un número entero de al menos 1, o dejarse vacío.');
      return;
    }
    if (!Number.isInteger(maxCount) || maxCount < 1 || (minCount !== undefined && maxCount < minCount)) {
      failValidation('El aforo máximo debe ser un entero de al menos 1 e igual o superior al mínimo indicado.');
      return;
    }
    if (activityPrice !== undefined && (!Number.isFinite(activityPrice) || activityPrice < 0)) {
      failValidation('El precio debe ser un número igual o superior a 0, o dejarse vacío.');
      return;
    }

    const payload: ActivityInput = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim().toUpperCase(),
      subcategory: subcategory.trim().toUpperCase(),
      modality,
      status: activity?.status ?? 'OPEN',
      location: {
        type: 'Point',
        ...(hasValidCoordinates && coordinates ? { coordinates } : {}),
        addressName: address.trim(),
        isStoreLocation: Boolean(isStoreLocation),
      },
      schedule: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
      capacity: {
        maxParticipants: maxCount,
        ...(minCount !== undefined ? { minParticipants: minCount } : {}),
      },
      ...(activityPrice !== undefined ? { pricing: { price: activityPrice } } : {}),
    };

    setSaving(true);
    setFormError(null);
    try {
      if (activityId) await updateActivity(activityId, payload);
      else await createActivity(payload);
      showToast(activityId ? 'Actividad actualizada.' : 'Actividad creada.');
      router.replace('/activities');
    } catch (error) {
      const message = error instanceof ApiError && error.status > 0
        ? `HTTP ${error.status}: ${error.message}`
        : error instanceof Error
          ? error.message
          : 'No se pudo guardar la actividad.';
      setFormError(message);
      Alert.alert('Error al guardar', message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingActivity) return <LoadingView title="Cargando actividad..." />;
  if (loadError) {
    return (
      <ErrorView
        title="No se pudo cargar la actividad"
        description={loadError}
        onRetry={() => {
          setLoadError(null);
          setLoadAttempt((attempt) => attempt + 1);
        }}
      />
    );
  }

  return (
    <ScreenWrapper scroll>
      <Header title={editing ? 'Editar actividad' : 'Nueva actividad'} />
      <AppInput label="Título" value={title} onChangeText={setTitle} maxLength={120} />
      <AppInput
        label="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.multiline}
      />
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Categoría</Text>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker
            selectedValue={category}
            onValueChange={(value: string) => {
              setCategory(value);
              const found = categories.find((item) => item.slug === value);
              setSubcategory(found?.subcategories[0]?.slug ?? '');
            }}
            style={[styles.picker, { color: colors.text }]}
          >
            {categories.length === 0 ? (
              <Picker.Item
                label={loadingCategories ? 'Cargando opciones...' : 'Opciones no disponibles'}
                value=""
              />
            ) : null}
            {categories.map((item) => (
              <Picker.Item key={item.slug} label={categoryLabel(item.slug, item.name)} value={item.slug} />
            ))}
          </Picker>
        </View>
      </View>
      {categoryLoadError ? (
        <View style={styles.categoryError}>
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
            {categoryLoadError}
          </Text>
          {categoriesMissing && user?.role === 'ADMIN' ? (
            <AppButton
              title="Cargar opciones iniciales"
              variant="secondary"
              loading={initializingCategories}
              disabled={loadingCategories}
              onPress={() => void loadInitialCategories()}
            />
          ) : (
            <AppButton
              title="Actualizar categorías"
              variant="secondary"
              disabled={loadingCategories}
              onPress={() => setCategoryLoadAttempt((attempt) => attempt + 1)}
            />
          )}
        </View>
      ) : null}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Subcategoría</Text>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker
            selectedValue={subcategory}
            enabled={Boolean(selectedCategory)}
            onValueChange={(value: string) => setSubcategory(value)}
            style={[styles.picker, { color: colors.text }]}
          >
            {!selectedCategory?.subcategories.length ? (
              <Picker.Item label="Sin subcategorías" value="" />
            ) : null}
            {selectedCategory?.subcategories.map((item) => (
              <Picker.Item key={item.slug} label={subcategoryLabel(item.slug, item.name)} value={item.slug} />
            ))}
          </Picker>
        </View>
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Modalidad</Text>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker
            selectedValue={modality}
            onValueChange={(value: Modality) => setModality(value)}
            style={[styles.picker, { color: colors.text }]}
          >
            {MODALITIES.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>
      </View>

      <AppInput
        label="Dirección"
        value={address}
        onChangeText={handleAddressChange}
        placeholder="Escribe al menos 3 caracteres"
        autoComplete="street-address"
      />
      {coordinates ? (
        <Text style={[styles.selectedAddress, { color: colors.primary }]}>Ubicación seleccionada</Text>
      ) : address.trim().length >= 3 ? (
        <Text style={[styles.locationHint, { color: colors.textSecondary }]}>
          Pulsa una sugerencia para fijar coordenadas exactas (opcional).
        </Text>
      ) : null}
      {loadingSuggestions ? <Text style={[styles.locationHint, { color: colors.textSecondary }]}>Buscando direcciones...</Text> : null}
      {suggestionError ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{suggestionError}</Text>
      ) : null}
      {suggestions.map((suggestion, index) => (
        <Pressable
          key={`${suggestion.coordinates[0]}-${suggestion.coordinates[1]}-${index}`}
          accessibilityRole="button"
          onPress={() => {
            setAddress(suggestion.label);
            setSelectedAddress(suggestion.label);
            setCoordinates(suggestion.coordinates);
            setSuggestions([]);
            setSuggestionError(null);
          }}
          style={[styles.suggestion, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion.label}</Text>
        </Pressable>
      ))}
      <View style={styles.switchRow}>
        <Text style={[styles.label, { color: colors.text }]}>¿Es una ubicación de tienda?</Text>
        <Switch value={isStoreLocation} onValueChange={(value) => setIsStoreLocation(Boolean(value))} />
      </View>

      <View style={styles.dateSection}>
        <Text style={[styles.label, { color: colors.text }]}>Inicio</Text>
        <View style={styles.dateActions}>
          <AppButton
            title={formatDateTime(startTime)}
            variant="secondary"
            onPress={() => setDatePicker({ target: 'start', mode: 'date' })}
          />
          <AppButton
            title="Hora"
            variant="ghost"
            onPress={() => setDatePicker({ target: 'start', mode: 'time' })}
          />
        </View>
      </View>
      <View style={styles.dateSection}>
        <Text style={[styles.label, { color: colors.text }]}>Fin</Text>
        <View style={styles.dateActions}>
          <AppButton
            title={formatDateTime(endTime)}
            variant="secondary"
            onPress={() => setDatePicker({ target: 'end', mode: 'date' })}
          />
          <AppButton
            title="Hora"
            variant="ghost"
            onPress={() => setDatePicker({ target: 'end', mode: 'time' })}
          />
        </View>
      </View>
      {datePicker ? (
        <View style={[styles.pickerSection, { backgroundColor: colors.surface }]}>
          <DateTimePicker
            value={datePicker.target === 'start' ? startTime : endTime}
            mode={datePicker.mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
          {Platform.OS === 'ios' ? (
            <AppButton title="Listo" variant="ghost" onPress={() => setDatePicker(null)} />
          ) : null}
        </View>
      ) : null}

      <View style={styles.numericRow}>
        <AppInput
          label="Aforo mínimo (opcional)"
          value={minParticipants}
          onChangeText={setMinParticipants}
          keyboardType="number-pad"
          placeholder="Por defecto: 2"
        />
        <AppInput
          label="Aforo máximo"
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          keyboardType="number-pad"
        />
      </View>
      <AppInput
        label="Precio (€) (opcional)"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />
      {formError ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{formError}</Text> : null}
      <AppButton
        title={editing ? 'Guardar cambios' : 'Crear actividad'}
        onPress={() => void handleSubmit()}
        loading={saving}
        disabled={saving || loadingCategories || categories.length === 0}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  pickerWrap: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {},
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: 10 },
  selectedAddress: { fontSize: 13 },
  locationHint: { fontSize: 13 },
  suggestion: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  suggestionText: { fontSize: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateSection: { gap: 8 },
  dateActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerSection: { padding: 8, borderRadius: 10 },
  numericRow: { flexDirection: 'row', gap: 10 },
  error: { fontSize: 14 },
  categoryError: { gap: 8 },
});
