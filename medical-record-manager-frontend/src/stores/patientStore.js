import { defineStore } from "pinia";
import { ref } from "vue";

export const usePatientStore = defineStore("patient", () => {
  const patients = ref([]);
  const currentPatientId = ref(null);

  const setPatients = (patientList) => {
    patients.value = patientList;
  };

  const setCurrentPatient = (patientId) => {
    currentPatientId.value = patientId;
  };

  const addPatient = (patient) => {
    patients.value.push(patient);
  };

  const removePatient = (patientId) => {
    patients.value = patients.value.filter((p) => p._id !== patientId);
  };

  return {
    patients,
    currentPatientId,
    setPatients,
    setCurrentPatient,
    addPatient,
    removePatient,
  };
});
