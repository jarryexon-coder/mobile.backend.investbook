import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const FilterModal = ({ visible, onClose, filters, onApply }) => {
  const [selectedSort, setSelectedSort] = useState(filters.sort || 'price_asc');
  const [selectedProperty, setSelectedProperty] = useState(filters.propertyType || 'all');
  const [minPrice, setMinPrice] = useState(filters.minPrice ? String(filters.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ? String(filters.maxPrice) : '');

  const propertyTypes = [
    { label: 'All Properties', value: 'all' },
    { label: 'Office', value: 'office' },
    { label: 'Retail', value: 'retail' },
    { label: 'Industrial', value: 'industrial' },
    { label: 'Land', value: 'land' },
    { label: 'Multifamily', value: 'multifamily' },
    { label: 'Commercial', value: 'commercial' },
  ];

  const sortOptions = [
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Newest First', value: 'date_desc' },
  ];

  const handleApply = () => {
    onApply({
      sort: selectedSort,
      propertyType: selectedProperty,
      minPrice: minPrice ? parseFloat(minPrice) : 0,
      maxPrice: maxPrice ? parseFloat(maxPrice) : 0,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedSort('price_asc');
    setSelectedProperty('all');
    setMinPrice('');
    setMaxPrice('');
  };

  // Quick price presets
  const pricePresets = [
    { label: 'Under $50k', value: 50 },
    { label: 'Under $100k', value: 100 },
    { label: 'Under $200k', value: 200 },
    { label: 'Under $500k', value: 500 },
    { label: 'Under $1M', value: 1000 },
    { label: 'Under $5M', value: 5000 },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Opportunities</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.filterOptions}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      selectedSort === option.value && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedSort(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedSort === option.value && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Property Type</Text>
              <View style={styles.filterOptions}>
                {propertyTypes.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      selectedProperty === option.value && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedProperty(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedProperty === option.value && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Price Range (in thousands)</Text>
              <Text style={styles.filterSubLabel}>Enter 200 = $200,000</Text>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min (K)"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
                <Text style={styles.priceRangeSeparator}>to</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max (K)"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Quick Price Presets</Text>
              <View style={styles.filterOptions}>
                {pricePresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[styles.filterChip, styles.presetChip]}
                    onPress={() => {
                      setMinPrice('');
                      setMaxPrice(String(preset.value));
                    }}
                  >
                    <Text style={styles.filterChipText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.resetButton]}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  filterSubLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
  },
  presetChip: {
    backgroundColor: '#e8f0fe',
    borderColor: '#2563eb',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 8,
  },
  priceInputLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  priceRangeSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#2563eb',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default FilterModal;
