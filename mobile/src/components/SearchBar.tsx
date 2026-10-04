import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Cari...",
  onFilterPress,
  filterActive,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filterActive?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.search}>
        <Ionicons name="search" size={17} color={colors.slate400} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.slate400}
          style={styles.input}
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={colors.slate400} />
          </Pressable>
        ) : null}
      </View>
      {onFilterPress ? (
        <Pressable onPress={onFilterPress} style={[styles.filterBtn, filterActive && styles.filterBtnActive]}>
          <Ionicons name="options-outline" size={19} color={filterActive ? colors.white : colors.navy} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, marginTop: 18, marginBottom: 14 },
  search: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: 15, height: 50, paddingHorizontal: 15 },
  input: { flex: 1, color: colors.navy, fontSize: 13 },
  filterBtn: { width: 50, height: 50, borderRadius: 15, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  filterBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
});
