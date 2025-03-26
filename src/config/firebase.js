import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCyf9Z_ISIQFDg3kVN3shsNGusi4-i9L8Q",
    authDomain: "personalassesment-a3583.firebaseapp.com",
    projectId: "personalassesment-a3583",
    storageBucket: "personalassesment-a3583.firebasestorage.app",
    messagingSenderId: "637195432393",
    appId: "1:637195432393:web:ee5972762e105998263818"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const uploadCertificate = async (file, userId) => {
    const storageRef = ref(storage, `certificates/${userId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

export const submitTestForm = async (formData, userId) => {
    try {
        // Handle certificate uploads
        const certificatePromises = formData.certifications.map(async (cert) => {
            if (cert.certificateFile) {
                const certificateUrl = await uploadCertificate(cert.certificateFile, userId);
                return {
                    ...cert,
                    certificateUrl,
                    certificateFile: null
                };
            }
            return cert;
        });

        const processedCertifications = await Promise.all(certificatePromises);

        // Prepare data structure
        const testData = {
            userId,
            personalInfo: {
                name: formData.name,
                email: formData.email,
                age: formData.age,
                githubLink: formData.githubLink,
                skills: formData.skills
            },
            education: {
                level: formData.educationLevel,
                details: formData.educationLevel === '12th' 
                    ? {
                        board: formData.board,
                        percentage: formData.percentage,
                        schoolName: formData.schoolName
                    }
                    : {
                        collegeName: formData.collegeName,
                        branchName: formData.branchName,
                        cgpa: formData.cgpa,
                        currentYear: formData.currentYear,
                        passoutYear: formData.passoutYear,
                        internship: formData.internship
                    }
            },
            programmingLanguages: formData.programmingLanguages,
            projects: formData.projects,
            certifications: processedCertifications,
            achievements: {
                hasAchievements: formData.hasAchievements,
                list: formData.achievements
            },
            socialActivities: formData.socialActivities,
            interpersonalSkills: formData.interpersonalSkills, // Merged new field
            submittedAt: new Date()
        };

        const docRef = await addDoc(collection(db, 'testSubmissions'), testData);
        return docRef.id;

    } catch (error) {
        console.error('Error submitting form:', error);
        throw error;
    }
};

export const getTestSubmission = async (submissionId) => {
    try {
        const docRef = doc(db, 'testSubmissions', submissionId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error fetching submission:', error);
        throw error;
    }
};
