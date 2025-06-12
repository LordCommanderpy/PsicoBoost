// src/components/PacientePerfilPage.js (Con edición de Familiares en línea)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaArrowLeft, FaProjectDiagram, FaSync, FaEdit, FaSave, FaTimes, FaClipboardList } from "react-icons/fa";
import GenogramaForm from "./GenogramaForm";
import ListaSesiones from "./ListaSesiones";

// Importaciones de Material-UI para visualización y edición en línea de familiares
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    List,
    ListItem,
    ListItemText,
    Box,
    TextField, // Para la edición de campos
    Select, // Para los select de género/estadoVital
    MenuItem,
    InputLabel,
    FormControl,
    Button, // Para los botones de añadir/eliminar familiar
    IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle'; // Icono para añadir familiar

// --- ESTILOS MEJORADOS (sin cambios significativos, solo añadí un estilo para el nuevo botón) ---
const styles = {
    container: {
        padding: "30px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        maxWidth: "850px",
        margin: "20px auto",
        backgroundColor: "#f9fafb",
        borderRadius: "12px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        border: "1px solid #e0e7eb"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
        paddingBottom: "15px",
        borderBottom: "2px solid #e0e7eb",
        flexWrap: "wrap",
        gap: "15px",
    },
    title: {
        margin: 0,
        fontSize: "2.2em",
        color: "#2c3e50",
        fontWeight: "600"
    },
    buttonGroup: {
        display: "flex",
        gap: "10px",
    },
    button: {
        padding: "10px 20px",
        backgroundColor: "#4a90e2",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "15px",
        transition: "all 0.3s ease",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    },
    backButton: {
        backgroundColor: "#6c757d",
    },
    retryButton: {
        backgroundColor: "#28a745",
    },
    genogramaButton: {
        backgroundColor: "#00b2a9",
    },
    perfilButton: {
        backgroundColor: "#6a0572",
    },
    sesionesButton: {
        backgroundColor: "#ff8c00",
    },
    editButton: {
        backgroundColor: "#ffc107",
        color: "#333",
    },
    saveButton: {
        backgroundColor: "#28a745",
    },
    cancelButton: {
        backgroundColor: "#dc3545",
    },
    buttonHover: {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
    },
    section: {
        marginBottom: "25px",
        padding: "25px",
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        border: "1px solid #e9ecef",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
    },
    field: {
        marginBottom: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        paddingBottom: "5px",
        borderBottom: "1px dotted #e0e0e0"
    },
    label: {
        fontWeight: "bold",
        minWidth: "160px",
        marginBottom: "4px",
        color: "#555",
        fontSize: "0.95em",
    },
    value: {
        fontSize: "1.1em",
        color: "#333",
    },
    input: {
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontSize: "1.1em",
        boxSizing: "border-box",
        marginTop: "5px",
    },
    select: {
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontSize: "1.1em",
        boxSizing: "border-box",
        marginTop: "5px",
    },
    textarea: {
        width: "100%",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontSize: "1.1em",
        boxSizing: "border-box",
        marginTop: "5px",
        minHeight: "80px",
        resize: "vertical",
    },
    icon: {
        fontSize: "16px",
    },
    errorText: {
        color: "#dc3545",
        marginBottom: "25px",
        fontSize: "1.2em",
        fontWeight: "bold",
        textAlign: "center",
        padding: "20px",
        backgroundColor: "#ffebee",
        borderRadius: "8px",
        border: "1px solid #ef9a9a"
    },
    loadingText: {
        textAlign: "center",
        padding: "30px",
        fontSize: "1.2em",
        color: "#4a90e2",
        fontWeight: "bold"
    },
    subHeading: {
        fontSize: "1.6em",
        color: "#34495e",
        borderBottom: "1px solid #ccc",
        paddingBottom: "10px",
        marginBottom: "20px",
        marginTop: "25px"
    },
    switchContainer: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '5px',
        borderBottom: '1px dotted #e0e0e0'
    },
    switchLabel: {
        fontWeight: 'bold',
        minWidth: '160px',
        color: '#555',
        fontSize: '0.95em',
        marginRight: '10px'
    }
};

const PacientePerfilPage = ({ pacienteId, onVolver, user }) => {
    const navigate = useNavigate();
    const [paciente, setPaciente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vista, setVista] = useState("perfil"); // 'perfil' o 'genograma'
    const [vistaInterna, setVistaInterna] = useState("perfil"); // 'perfil', 'sesiones'
    const [isEditing, setIsEditing] = useState(false);
    const [editedPaciente, setEditedPaciente] = useState(null);
    const [expandedAccordion, setExpandedAccordion] = useState(null); // Para controlar acordeones de familiares

    console.log("PacientePerfilPage (al renderizar): pacienteId recibido como prop:", pacienteId);

    const fetchPacienteData = async () => {
        console.log("PacientePerfilPage: fetchPacienteData - Intentando cargar paciente con ID:", pacienteId);

        if (!pacienteId) {
            console.error("PacientePerfilPage: fetchPacienteData - pacienteId es undefined o nulo. No se puede cargar el paciente.");
            setError("ID de paciente no proporcionado. Por favor, vuelva a la lista e intente de nuevo.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const docRef = doc(db, "pacientes", pacienteId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error("No se encontró el paciente con el ID proporcionado.");
            }

            const data = docSnap.data();

            // Cargar todos los campos desde Firestore, con valores por defecto si no existen
            const loadedPaciente = {
                id: docSnap.id,
                nombre: data.nombre || '',
                apellido: data.apellido || '',
                fechaNacimiento: data.fechaNacimiento || '', // Agregado
                edad: data.edad || '',
                genero: data.genero || '',
                telefono: data.telefono || '',
                email: data.email || '', // Agregado
                contactoEmergencia: { // Agregado
                    nombre: data.contactoEmergencia?.nombre || '',
                    telefono: data.contactoEmergencia?.telefono || '',
                    vinculo: data.contactoEmergencia?.vinculo || '',
                },
                direccion: data.direccion || '', // Agregado
                motivo: data.motivo || '',
                estado: data.estado || '',
                prioridad: data.prioridad || false, // Agregado
                diagnosticos: data.diagnosticos || '', // Agregado
                medicamentos: data.medicamentos || '', // Agregado
                ocupacion: data.ocupacion || '', // Agregado
                nivelEducativo: data.nivelEducativo || '', // Agregado
                estadoCivil: data.estadoCivil || '', // Agregado
                intereses: data.intereses || '', // Agregado
                comentariosAdicionales: data.comentariosAdicionales || '', // Agregado
                genograma: { // Genograma básico (padre/madre)
                    padre: {
                        nombre: data.genograma?.padre?.nombre || '',
                        apellido: data.genograma?.padre?.apellido || '',
                        telefono: data.genograma?.padre?.telefono || ''
                    },
                    madre: {
                        nombre: data.genograma?.madre?.nombre || '',
                        apellido: data.genograma?.madre?.apellido || '',
                        telefono: data.genograma?.madre?.telefono || ''
                    }
                },
                familiares: data.familiares || [], // ¡Cargar el array de familiares aquí!
            };

            setPaciente(loadedPaciente);
            setEditedPaciente(loadedPaciente); // Inicializa editedPaciente con los datos cargados
            console.log("PacientePerfilPage: Paciente cargado exitosamente:", docSnap.id, loadedPaciente);
        } catch (err) {
            console.error("PacientePerfilPage: Error al cargar paciente:", err);
            setError(err.message || "Error al cargar los datos del paciente. Revise su conexión o permisos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (pacienteId) {
            fetchPacienteData();
        } else {
            setError("ID de paciente no proporcionado. No se puede cargar el perfil.");
            setLoading(false);
        }
    }, [pacienteId]);

    const handleVolverClick = () => {
        if (onVolver) {
            onVolver();
        } else {
            navigate(-1); // Volver a la página anterior (tu lista de pacientes)
        }
    };
    const handleReintentar = () => fetchPacienteData();

    const handleEditClick = () => {
        setIsEditing(true);
        // setEditedPaciente ya se inicializó con el paciente cargado
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedPaciente(paciente); // Revertir a los datos originales
        setError(null);
        setExpandedAccordion(null); // Colapsar acordeones de edición de familiares
    };

    // Manejar cambios en campos de nivel superior del paciente
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith("padre") || name.startsWith("madre")) {
            const [parentType, fieldName] = name.split("_");
            setEditedPaciente(prev => ({
                ...prev,
                genograma: {
                    ...prev.genograma,
                    [parentType]: {
                        ...prev.genograma[parentType],
                        [fieldName]: value
                    }
                }
            }));
        } else if (name.startsWith("contactoEmergencia")) {
            const [, fieldName] = name.split("_");
            setEditedPaciente(prev => ({
                ...prev,
                contactoEmergencia: {
                    ...prev.contactoEmergencia,
                    [fieldName]: value
                }
            }));
        } else if (type === "checkbox") {
            setEditedPaciente(prev => ({
                ...prev,
                [name]: checked
            }));
        }
        else {
            setEditedPaciente(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // --- Lógica para MANEJO DE FAMILIARES (Agregar/Editar/Eliminar) ---
    const handleFamiliarChange = (index, field, value) => {
        setEditedPaciente(prev => {
            const updatedFamiliares = [...prev.familiares];
            updatedFamiliares[index] = { ...updatedFamiliares[index], [field]: value };
            return { ...prev, familiares: updatedFamiliares };
        });
    };

    const addFamiliar = () => {
        // Asegúrate de que los IDs sean únicos. Usamos la longitud + 1 si no hay IDs, o el max ID + 1
        const newId = editedPaciente.familiares.length > 0
            ? Math.max(...editedPaciente.familiares.map(f => f.id || 0)) + 1
            : 0; // Si no hay IDs, empezar en 0 o 1
        setEditedPaciente(prev => ({
            ...prev,
            familiares: [
                ...prev.familiares,
                {
                    id: newId, // Clave para React y para Firestore
                    nombre: '', apellido: '', vinculo: '', edad: '',
                    estadoVital: 'vivo', notas: '', telefono: '', causaFallecimiento: '',
                }
            ]
        }));
        setExpandedAccordion(`familiar-panel-${newId}`); // Expandir el nuevo familiar automáticamente
    };

    const removeFamiliar = (idToRemove) => {
        setEditedPaciente(prev => ({
            ...prev,
            familiares: prev.familiares.filter(f => f.id !== idToRemove)
        }));
        if (expandedAccordion === `familiar-panel-${idToRemove}`) {
            setExpandedAccordion(null); // Colapsar si se elimina el acordeón abierto
        }
    };

    // Manejador para expandir/colapsar acordeones de familiares
    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpandedAccordion(isExpanded ? panel : null);
    };
    // --- FIN Lógica para MANEJO DE FAMILIARES ---


    const handleSaveChanges = async () => {
        setLoading(true);
        setError(null);

        if (!editedPaciente || !editedPaciente.id) {
            setError("Error: No hay datos de paciente para guardar.");
            setLoading(false);
            return;
        }

        try {
            const pacienteRef = doc(db, "pacientes", editedPaciente.id);

            // Preparar los datos para la actualización
            const datosParaActualizar = {
                nombre: editedPaciente.nombre,
                apellido: editedPaciente.apellido,
                fechaNacimiento: editedPaciente.fechaNacimiento,
                edad: Number(editedPaciente.edad), // Asegurar que la edad sea un número
                genero: editedPaciente.genero,
                telefono: editedPaciente.telefono,
                email: editedPaciente.email,
                contactoEmergencia: editedPaciente.contactoEmergencia,
                direccion: editedPaciente.direccion,
                motivo: editedPaciente.motivo,
                estado: editedPaciente.estado,
                prioridad: editedPaciente.prioridad,
                diagnosticos: editedPaciente.diagnosticos,
                medicamentos: editedPaciente.medicamentos,
                ocupacion: editedPaciente.ocupacion,
                nivelEducativo: editedPaciente.nivelEducativo,
                estadoCivil: editedPaciente.estadoCivil,
                intereses: editedPaciente.intereses,
                comentariosAdicionales: editedPaciente.comentariosAdicionales,
                familiares: editedPaciente.familiares.map(f => ({
                    id: f.id,
                    nombre: f.nombre,
                    apellido: f.apellido,
                    vinculo: f.vinculo,
                    edad: Number(f.edad),
                    estadoVital: f.estadoVital,
                    notas: f.notas,
                    telefono: f.telefono,
                    causaFallecimiento: f.causaFallecimiento,
                })).filter(f => f.nombre || f.apellido || f.vinculo), // Filtra si al menos tiene nombre, apellido o vínculo
            };

            // Solo incluir genograma si es menor (para compatibilidad con tu estructura original)
            if (Number(editedPaciente.edad) < 18) {
                datosParaActualizar.genograma = {
                    padre: {
                        nombre: editedPaciente.genograma?.padre?.nombre || '',
                        apellido: editedPaciente.genograma?.padre?.apellido || '',
                        telefono: editedPaciente.genograma?.padre?.telefono || ''
                    },
                    madre: {
                        nombre: editedPaciente.genograma?.madre?.nombre || '',
                        apellido: editedPaciente.genograma?.madre?.apellido || '',
                        telefono: editedPaciente.genograma?.madre?.telefono || ''
                    }
                };
            } else {
                // Si ya no es menor, o nunca lo fue, asegurarse de que no haya un genograma "antiguo"
                datosParaActualizar.genograma = null;
            }


            await updateDoc(pacienteRef, datosParaActualizar);
            setPaciente(editedPaciente); // Actualiza el paciente principal con los datos editados
            setIsEditing(false); // Sale del modo de edición
            console.log("Paciente actualizado exitosamente en Firestore.");
        } catch (err) {
            console.error("Error al guardar cambios del paciente:", err);
            setError("Error al guardar cambios: " + (err.message || "Verifique su conexión o permisos."));
        } finally {
            setLoading(false);
        }
    };

    const isMinor = editedPaciente && Number(editedPaciente.edad) < 18;
    const displayPaciente = isEditing ? editedPaciente : paciente;

    if (loading) {
        return (
            <div style={styles.loadingText}>
                <p>Cargando datos del paciente...</p>
                <button
                    onClick={handleReintentar}
                    style={{ ...styles.button, ...styles.retryButton }}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.retryButton)}
                >
                    <FaSync style={styles.icon} /> Reintentar
                </button>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                <p style={styles.errorText}>{error}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
                    <button
                        onClick={handleVolverClick}
                        style={{ ...styles.button, ...styles.backButton }}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.backButton)}
                    >
                        <FaArrowLeft style={styles.icon} /> Volver
                    </button>
                    <button
                        onClick={handleReintentar}
                        style={{ ...styles.button, ...styles.retryButton }}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.retryButton)}
                    >
                        <FaSync style={styles.icon} /> Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!paciente) {
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                <p style={styles.errorText}>No se pudo cargar la información del paciente. Intente recargar.</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
                    <button
                        onClick={handleVolverClick}
                        style={{ ...styles.button, ...styles.backButton }}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.backButton)}
                    >
                        <FaArrowLeft style={styles.icon} /> Volver
                    </button>
                    <button
                        onClick={handleReintentar}
                        style={{ ...styles.button, ...styles.retryButton }}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.retryButton)}
                    >
                        <FaSync style={styles.icon} /> Reintentar
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Ficha de {displayPaciente.nombre} {displayPaciente.apellido}</h2>
                <div style={styles.buttonGroup}>
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSaveChanges}
                                style={{ ...styles.button, ...styles.saveButton }}
                                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.saveButton)}
                            >
                                <FaSave style={styles.icon} /> Guardar Cambios
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                style={{ ...styles.button, ...styles.cancelButton }}
                                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cancelButton)}
                            >
                                <FaTimes style={styles.icon} /> Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleVolverClick}
                                style={{ ...styles.button, ...styles.backButton }}
                                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.backButton)}
                            >
                                <FaArrowLeft style={styles.icon} /> Volver
                            </button>
                            {/* Botón para cambiar entre Perfil y Genograma */}
                            {vistaInterna === "perfil" && (
                                <button
                                    onClick={() => { setVista(vista === "perfil" ? "genograma" : "perfil"); }}
                                    style={{
                                        ...styles.button,
                                        ...(vista === "perfil" ? styles.genogramaButton : styles.perfilButton)
                                    }}
                                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, (vista === "perfil" ? styles.genogramaButton : styles.perfilButton))}
                                >
                                    <FaProjectDiagram style={styles.icon} />
                                    {vista === "perfil" ? "Ver Genograma" : "Ver Perfil"}
                                </button>
                            )}

                            {/* NUEVO BOTÓN PARA SESIONES */}
                            <button
                                onClick={() => {
                                    setVistaInterna('sesiones');
                                    setIsEditing(false); // Asegura salir del modo edición al ir a sesiones
                                    setVista("perfil"); // Si vuelves a perfil, que se muestre el perfil principal
                                }}
                                style={{
                                    ...styles.button,
                                    ...styles.sesionesButton
                                }}
                                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.sesionesButton)}
                            >
                                <FaClipboardList style={styles.icon} /> Ver Sesiones
                            </button>

                            {/* El botón Editar Paciente solo si estamos en la vista de perfil principal y no editando ya */}
                            {vistaInterna === "perfil" && !isEditing && (
                                <button
                                    onClick={handleEditClick}
                                    style={{ ...styles.button, ...styles.editButton }}
                                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
                                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.editButton)}
                                >
                                    <FaEdit style={styles.icon} /> Editar Paciente
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* RENDERIZADO CONDICIONAL BASADO EN vistaInterna */}
            {vistaInterna === "perfil" && vista === "perfil" && ( // Muestra el perfil si estamos en la vista principal y sub-vista de perfil
                <div style={styles.section}>
                    <h3 style={styles.subHeading}>Datos Personales y Contacto</h3>
                    <div style={styles.field}>
                        <span style={styles.label}>Nombre completo:</span>
                        {isEditing ? (
                            <TextField
                                type="text"
                                name="nombre"
                                value={displayPaciente.nombre}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.nombre} {displayPaciente.apellido}</span>
                        )}
                    </div>
                    {isEditing && (
                        <div style={styles.field}>
                            <span style={styles.label}>Apellido:</span>
                            <TextField
                                type="text"
                                name="apellido"
                                value={displayPaciente.apellido}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        </div>
                    )}
                    <div style={styles.field}>
                        <span style={styles.label}>Fecha de Nacimiento:</span>
                        {isEditing ? (
                            <TextField
                                type="date"
                                name="fechaNacimiento"
                                value={displayPaciente.fechaNacimiento}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.fechaNacimiento || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Edad:</span>
                        {isEditing ? (
                            <TextField
                                type="number"
                                name="edad"
                                value={displayPaciente.edad}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.edad} años</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Género:</span>
                        {isEditing ? (
                            <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                                <InputLabel>Género</InputLabel>
                                <Select
                                    name="genero"
                                    value={displayPaciente.genero}
                                    onChange={handleInputChange}
                                    label="Género"
                                >
                                    <MenuItem value="">Seleccionar</MenuItem>
                                    <MenuItem value="femenino">Femenino</MenuItem>
                                    <MenuItem value="masculino">Masculino</MenuItem>
                                    <MenuItem value="otro">Otro</MenuItem>
                                </Select>
                            </FormControl>
                        ) : (
                            <span style={styles.value}>{displayPaciente.genero || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Teléfono:</span>
                        {isEditing ? (
                            <TextField
                                type="text"
                                name="telefono"
                                value={displayPaciente.telefono}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.telefono || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Email:</span>
                        {isEditing ? (
                            <TextField
                                type="email"
                                name="email"
                                value={displayPaciente.email}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.email || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Dirección:</span>
                        {isEditing ? (
                            <TextField
                                type="text"
                                name="direccion"
                                value={displayPaciente.direccion}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.direccion || "No especificado"}</span>
                        )}
                    </div>

                    <h3 style={styles.subHeading}>Contacto de Emergencia</h3>
                    <div style={styles.field}>
                        <span style={styles.label}>Nombre Contacto:</span>
                        {isEditing ? (
                            <TextField
                                type="text"
                                name="contactoEmergencia_nombre"
                                value={displayPaciente.contactoEmergencia?.nombre || ''}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.contactoEmergencia?.nombre || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Teléfono Contacto:</span>
                        {isEditing ? (
                            <TextField
                                type="text"
                                name="contactoEmergencia_telefono"
                                value={displayPaciente.contactoEmergencia?.telefono || ''}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.contactoEmergencia?.telefono || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Vínculo Contacto:</span>
                        {isEditing ? (
                            <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                                <InputLabel>Vínculo</InputLabel>
                                <Select
                                    name="contactoEmergencia_vinculo"
                                    value={displayPaciente.contactoEmergencia?.vinculo || ''}
                                    onChange={handleInputChange}
                                    label="Vínculo"
                                >
                                    <MenuItem value="">Seleccionar</MenuItem>
                                    <MenuItem value="padre">Padre</MenuItem>
                                    <MenuItem value="madre">Madre</MenuItem>
                                    <MenuItem value="hermano">Hermano/a</MenuItem>
                                    <MenuItem value="conyuge_pareja">Cónyuge/Pareja</MenuItem>
                                    <MenuItem value="hijo">Hijo/a</MenuItem>
                                    <MenuItem value="amigo">Amigo/a</MenuItem>
                                    <MenuItem value="familiar_extendido">Familiar Extendido</MenuItem>
                                    <MenuItem value="otro">Otro</MenuItem>
                                </Select>
                            </FormControl>
                        ) : (
                            <span style={styles.value}>{displayPaciente.contactoEmergencia?.vinculo || "No especificado"}</span>
                        )}
                    </div>

                    <h3 style={styles.subHeading}>Motivo y Estado Clínico</h3>
                    <div style={styles.field}>
                        <span style={styles.label}>Motivo de Consulta:</span>
                        {isEditing ? (
                            <TextField
                                name="motivo"
                                value={displayPaciente.motivo}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={4}
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={{ ...styles.value, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayPaciente.motivo || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Diagnóstico(s):</span>
                        {isEditing ? (
                            <TextField
                                name="diagnosticos"
                                value={displayPaciente.diagnosticos}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={{ ...styles.value, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayPaciente.diagnosticos || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Medicamentos Actuales:</span>
                        {isEditing ? (
                            <TextField
                                name="medicamentos"
                                value={displayPaciente.medicamentos}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={{ ...styles.value, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayPaciente.medicamentos || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Estado:</span>
                        {isEditing ? (
                            <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    name="estado"
                                    value={displayPaciente.estado}
                                    onChange={handleInputChange}
                                    label="Estado"
                                >
                                    <MenuItem value="activo">Activo</MenuItem>
                                    <MenuItem value="inactivo">Inactivo</MenuItem>
                                    <MenuItem value="dado_de_alta">Dado de Alta</MenuItem>
                                </Select>
                            </FormControl>
                        ) : (
                            <span style={styles.value}>{displayPaciente.estado}</span>
                        )}
                    </div>
                    <div style={styles.switchContainer}>
                        <span style={styles.switchLabel}>Alta Prioridad:</span>
                        {isEditing ? (
                            <input
                                type="checkbox"
                                name="prioridad"
                                checked={displayPaciente.prioridad}
                                onChange={handleInputChange}
                                style={{ transform: 'scale(1.2)' }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.prioridad ? "Sí" : "No"}</span>
                        )}
                    </div>

                    <h3 style={styles.subHeading}>Información Adicional</h3>
                    <div style={styles.field}>
                        <span style={styles.label}>Ocupación / Profesión:</span>
                        {isEditing ? (
                            <TextField
                                type="text"
                                name="ocupacion"
                                value={displayPaciente.ocupacion}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.ocupacion || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Nivel Educativo:</span>
                        {isEditing ? (
                            <TextField
                                type="text"
                                name="nivelEducativo"
                                value={displayPaciente.nivelEducativo}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={styles.value}>{displayPaciente.nivelEducativo || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Estado Civil:</span>
                        {isEditing ? (
                            <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                                <InputLabel>Estado Civil</InputLabel>
                                <Select
                                    name="estadoCivil"
                                    value={displayPaciente.estadoCivil}
                                    onChange={handleInputChange}
                                    label="Estado Civil"
                                >
                                    <MenuItem value="">Seleccionar</MenuItem>
                                    <MenuItem value="soltero">Soltero/a</MenuItem>
                                    <MenuItem value="casado">Casado/a</MenuItem>
                                    <MenuItem value="union_libre">Unión Libre</MenuItem>
                                    <MenuItem value="divorciado">Divorciado/a</MenuItem>
                                    <MenuItem value="viudo">Viudo/a</MenuItem>
                                </Select>
                            </FormControl>
                        ) : (
                            <span style={styles.value}>{displayPaciente.estadoCivil || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Intereses / Hobbies:</span>
                        {isEditing ? (
                            <TextField
                                name="intereses"
                                value={displayPaciente.intereses}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={2}
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={{ ...styles.value, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayPaciente.intereses || "No especificado"}</span>
                        )}
                    </div>
                    <div style={styles.field}>
                        <span style={styles.label}>Comentarios Adicionales:</span>
                        {isEditing ? (
                            <TextField
                                name="comentariosAdicionales"
                                value={displayPaciente.comentariosAdicionales}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                                variant="outlined"
                                sx={{ mt: 1 }}
                            />
                        ) : (
                            <span style={{ ...styles.value, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayPaciente.comentariosAdicionales || "No especificado"}</span>
                        )}
                    </div>

                    {/* Mostrar los campos de padre/madre del genograma antiguo solo si el paciente es menor */}
                    {isMinor && (
                        <div style={{ marginTop: "20px" }}>
                            <h3 style={styles.subHeading}>Datos de los Padres (Genograma Básico)</h3>
                            <div style={styles.field}>
                                <span style={styles.label}>Nombre del Padre:</span>
                                {isEditing ? (
                                    <TextField
                                        type="text"
                                        name="padre_nombre"
                                        value={displayPaciente.genograma?.padre?.nombre || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        variant="outlined"
                                        sx={{ mt: 1 }}
                                    />
                                ) : (
                                    <span style={styles.value}>
                                        {displayPaciente.genograma?.padre?.nombre} {displayPaciente.genograma?.padre?.apellido}
                                        {displayPaciente.genograma?.padre?.telefono && ` (Tel: ${displayPaciente.genograma.padre.telefono})`}
                                        {(!displayPaciente.genograma?.padre?.nombre && !displayPaciente.genograma?.padre?.apellido) && "No especificado"}
                                    </span>
                                )}
                            </div>
                            {isEditing && (
                                <>
                                    <div style={styles.field}>
                                        <span style={styles.label}>Apellido del Padre:</span>
                                        <TextField
                                            type="text"
                                            name="padre_apellido"
                                            value={displayPaciente.genograma?.padre?.apellido || ''}
                                            onChange={handleInputChange}
                                            fullWidth
                                            variant="outlined"
                                            sx={{ mt: 1 }}
                                        />
                                    </div>
                                    <div style={styles.field}>
                                        <span style={styles.label}>Teléfono del Padre:</span>
                                        <TextField
                                            type="text"
                                            name="padre_telefono"
                                            value={displayPaciente.genograma?.padre?.telefono || ''}
                                            onChange={handleInputChange}
                                            fullWidth
                                            variant="outlined"
                                            sx={{ mt: 1 }}
                                        />
                                    </div>
                                </>
                            )}
                            <div style={styles.field}>
                                <span style={styles.label}>Nombre de la Madre:</span>
                                {isEditing ? (
                                    <TextField
                                        type="text"
                                        name="madre_nombre"
                                        value={displayPaciente.genograma?.madre?.nombre || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        variant="outlined"
                                        sx={{ mt: 1 }}
                                    />
                                ) : (
                                    <span style={styles.value}>
                                        {displayPaciente.genograma?.madre?.nombre} {displayPaciente.genograma?.madre?.apellido}
                                        {displayPaciente.genograma?.madre?.telefono && ` (Tel: ${displayPaciente.genograma.madre.telefono})`}
                                        {(!displayPaciente.genograma?.madre?.nombre && !displayPaciente.genograma?.madre?.apellido) && "No especificado"}
                                    </span>
                                )}
                            </div>
                            {isEditing && (
                                <>
                                    <div style={styles.field}>
                                        <span style={styles.label}>Apellido de la Madre:</span>
                                        <TextField
                                            type="text"
                                            name="madre_apellido"
                                            value={displayPaciente.genograma?.madre?.apellido || ''}
                                            onChange={handleInputChange}
                                            fullWidth
                                            variant="outlined"
                                            sx={{ mt: 1 }}
                                        />
                                    </div>
                                    <div style={styles.field}>
                                        <span style={styles.label}>Teléfono de la Madre:</span>
                                        <TextField
                                            type="text"
                                            name="madre_telefono"
                                            value={displayPaciente.genograma?.madre?.telefono || ''}
                                            onChange={handleInputChange}
                                            fullWidth
                                            variant="outlined"
                                            sx={{ mt: 1 }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* SECCIÓN DE DATOS FAMILIARES (USANDO ACORDEONES) */}
                    <h3 style={styles.subHeading}>Datos Familiares (Detallado)</h3>
                    {displayPaciente.familiares && displayPaciente.familiares.length > 0 ? (
                        <List>
                            {displayPaciente.familiares.map((familiar, index) => (
                                <Accordion
                                    key={familiar.id || index} // Usa id si existe, sino index
                                    expanded={expandedAccordion === `familiar-panel-${familiar.id || index}`}
                                    onChange={handleAccordionChange(`familiar-panel-${familiar.id || index}`)}
                                    sx={{ mb: 1, border: '1px solid #f0f0f0' }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {familiar.nombre} {familiar.apellido} ({familiar.vinculo})
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box sx={{ pl: 2 }}>
                                            {isEditing ? (
                                                <>
                                                    <TextField label="Nombre" variant="outlined" fullWidth value={familiar.nombre} onChange={(e) => handleFamiliarChange(index, 'nombre', e.target.value)} sx={{ mb: 1 }} />
                                                    <TextField label="Apellido" variant="outlined" fullWidth value={familiar.apellido} onChange={(e) => handleFamiliarChange(index, 'apellido', e.target.value)} sx={{ mb: 1 }} />
                                                    <FormControl fullWidth variant="outlined" sx={{ mb: 1 }}>
                                                        <InputLabel>Vínculo</InputLabel>
                                                        <Select value={familiar.vinculo} onChange={(e) => handleFamiliarChange(index, 'vinculo', e.target.value)} label="Vínculo">
                                                            <MenuItem value="">Seleccionar</MenuItem>
                                                            <MenuItem value="Padre">Padre</MenuItem>
                                                            <MenuItem value="Madre">Madre</MenuItem>
                                                            <MenuItem value="Hermano/a">Hermano/a</MenuItem>
                                                            <MenuItem value="Cónyuge/Pareja">Cónyuge/Pareja</MenuItem>
                                                            <MenuItem value="Hijo/a">Hijo/a</MenuItem>
                                                            <MenuItem value="Abuelo/a Paterno">Abuelo/a Paterno</MenuItem>
                                                            <MenuItem value="Abuelo/a Materno">Abuelo/a Materno</MenuItem>
                                                            <MenuItem value="Tío/a Paterno/a">Tío/a Paterno/a</MenuItem>
                                                            <MenuItem value="Tío/a Materno/a">Tío/a Materno/a</MenuItem>
                                                            <MenuItem value="Primo/a">Primo/a</MenuItem>
                                                            <MenuItem value="Hijastro/a">Hijastro/a</MenuItem>
                                                            <MenuItem value="Cuñado/a">Cuñado/a</MenuItem>
                                                            <MenuItem value="Otro">Otro</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    <TextField label="Edad" type="number" variant="outlined" fullWidth value={familiar.edad} onChange={(e) => handleFamiliarChange(index, 'edad', e.target.value)} sx={{ mb: 1 }} InputProps={{ inputProps: { min: 0, max: 120 } }} />
                                                    <FormControl fullWidth variant="outlined" sx={{ mb: 1 }}>
                                                        <InputLabel>Estado Vital</InputLabel>
                                                        <Select value={familiar.estadoVital} onChange={(e) => handleFamiliarChange(index, 'estadoVital', e.target.value)} label="Estado Vital">
                                                            <MenuItem value="vivo">Vivo</MenuItem>
                                                            <MenuItem value="fallecido">Fallecido</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    {familiar.estadoVital === 'fallecido' && (
                                                        <TextField label="Causa Fallecimiento" variant="outlined" fullWidth value={familiar.causaFallecimiento || ''} onChange={(e) => handleFamiliarChange(index, 'causaFallecimiento', e.target.value)} sx={{ mb: 1 }} />
                                                    )}
                                                    <TextField label="Teléfono" variant="outlined" fullWidth value={familiar.telefono} onChange={(e) => handleFamiliarChange(index, 'telefono', e.target.value)} sx={{ mb: 1 }} />
                                                    <TextField label="Notas" variant="outlined" fullWidth multiline rows={2} value={familiar.notas} onChange={(e) => handleFamiliarChange(index, 'notas', e.target.value)} sx={{ mb: 2 }} />
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <Button
                                                            onClick={() => removeFamiliar(familiar.id)}
                                                            color="error"
                                                            variant="outlined"
                                                            startIcon={<DeleteIcon />}
                                                            sx={{ mt: 1 }}
                                                        >
                                                            Eliminar
                                                        </Button>
                                                    </Box>
                                                </>
                                            ) : (
                                                <>
                                                    <Typography variant="body2">**Vínculo:** {familiar.vinculo || 'N/A'}</Typography>
                                                    <Typography variant="body2">**Edad:** {familiar.edad ? `${familiar.edad} años` : 'N/A'}</Typography>
                                                    <Typography variant="body2">**Estado Vital:** {familiar.estadoVital || 'N/A'}</Typography>
                                                    {familiar.estadoVital === 'fallecido' && familiar.causaFallecimiento && (
                                                        <Typography variant="body2">**Causa Fallecimiento:** {familiar.causaFallecimiento}</Typography>
                                                    )}
                                                    {familiar.telefono && <Typography variant="body2">**Teléfono:** {familiar.telefono}</Typography>}
                                                    {familiar.notas && <Typography variant="body2">**Notas:** {familiar.notas}</Typography>}
                                                </>
                                            )}
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body1" sx={{ fontStyle: 'italic', color: '#777' }}>
                            No hay familiares registrados para este paciente.
                        </Typography>
                    )}
                    {isEditing && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <Button
                                onClick={addFamiliar}
                                variant="contained"
                                color="primary"
                                startIcon={<AddCircleIcon />}
                            >
                                Añadir Nuevo Familiar
                            </Button>
                        </Box>
                    )}
                </div>
            )}

            {vistaInterna === "perfil" && vista === "genograma" && (
                <div style={styles.section}>
                    <GenogramaForm
                        pacienteId={paciente.id}
                        datosFamiliares={displayPaciente.genograma}
                    />
                </div>
            )}

            {vistaInterna === "sesiones" && (
                <div style={styles.section}>
                    <ListaSesiones
                        pacienteId={paciente.id}
                        user={user}
                        nombrePaciente={`${paciente.nombre} ${paciente.apellido}`}
                    />
                </div>
            )}
        </div>
    );
};

export default PacientePerfilPage;