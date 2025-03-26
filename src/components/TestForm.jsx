import React, { useState } from 'react';
import { db, storage, auth } from '../config/firebase'; 
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Link, useNavigate } from 'react-router-dom';  // Add useNavigate to imports
import { GoogleGenerativeAI } from "@google/generative-ai";
import './TestForm.css';
import { useTheme } from '../context/ThemeContext';
import { BsMoonFill, BsSunFill } from 'react-icons/bs';
const TestForm = () => {
  const navigate = useNavigate();
  const [finalScore, setFinalScore] = useState(0); // Add this line
  const [blogContent, setBlogContent] = useState("");
  const [loading, setLoading] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [formData, setFormData] = useState({
    
    name: '',
    email: '',
    age: '',
    githubLink: '',
    skills: [],
    
    
    educationLevel: '',
    
    board: '',
    percentage: '',
    schoolName: '',
    
    collegeName: '',
    branchName: '',
    cgpa: '',
    currentYear: '',
    passoutYear: '',
    internship: '',
    
    programmingLanguages: [{ name: '', level: '' }],
    projects: [''],

    
    certifications: [{
      name: '',
      issuedBy: '',
      issueDate: '',
      certificateFile: null
    }],

    hasAchievements: false,
    achievements: [''],
    socialActivities: '',
    interpersonalSkills: '',
  });
    const [currentSkill, setCurrentSkill] = useState('');

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' && currentSkill.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(currentSkill.trim())) {
        setFormData({
          ...formData,
          skills: [...formData.skills, currentSkill.trim()]
        });
      }
      setCurrentSkill('');
    }
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const apikey = import.meta.env.VITE_PUBLIC_GEMINI_API_KEY;
const genAi = new GoogleGenerativeAI(apikey);
const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" }); // Ensure correct version


const prompt = `You are an AI expert trained to evaluate a user's technical skills, interpersonal abilities, achievements, and academic background. Your task is to analyze the provided data, assign category-wise scores, and generate a structured report including strengths, weaknesses, and personalized improvement suggestions.

Scoring Criteria (Each out of 100): 
1️⃣ Technical Skills Analysis - Evaluate based on the claimed expertise level (Beginner, Intermediate, Expert). Verify skill credibility using GitHub projects, certifications, or prior experience. If no projects/certifications exist, assume a lower proficiency level. Scoring Weight: Beginner → 30% weight, Intermediate → 60% weight, Expert → 100% weight. Bonus points for real-world experience and problem-solving ability.  
2️⃣ Interpersonal Skills Assessment - Evaluate the user's response regarding teamwork, leadership, and communication skills. Analyze logical reasoning, confidence, and clarity in their response, and provide feedback. 
3️⃣ Academic Performance Evaluation - Consider 12th percentage, CGPA, and relevant coursework. Give higher weight to core subjects and industry-relevant courses. Bonus points for academic projects, research papers, or high-performance in technical subjects.  
4️⃣ Achievements & Certifications Scoring - Check credibility of certifications (Google, AWS, Coursera, Udemy, etc.), rank certifications based on relevance to the user's skillset, assign higher scores for internships, hackathons, and real-world projects, and reduce points for outdated or irrelevant certifications.  
5️⃣ Final Score Calculation (Out of 100) - Use a weighted average of all categories and normalize the score if necessary.

Please ensure to include the final score in this exact format at the end of your response:
Final Score: [number between 0-100]`;


const user_input = {
  technical_skills: formData.skills.map(skill => ({
    name: skill,
    projects: formData.githubLink
  })),
  interpersonal_skills: formData.interpersonalSkills, 
  academic_details: {
    "12th_percentage": formData.percentage,
    CGPA: formData.cgpa,
    courses: formData.certifications.map(cert => cert.name),
  },
  achievements: {
    certifications: formData.certifications.map(cert => cert.name),
    hackathons: formData.hasAchievements ? formData.achievements : [],
  },
};


  const handleGenerateAIResponse = async () => {
    setLoading(true);
    setAnalysis("");
  
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${prompt}\n\n${JSON.stringify(user_input)}` }] }],
        generationConfig: {
          maxOutputTokens: 1500, 
          temperature: 0.6, 
        },
      });
  
      const rawResponse = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "AI response unavailable";
      
      // Extract score before formatting the response
      const scoreMatch = rawResponse.match(/Final Score:\s*(\d+)/);
      const finalScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      console.log("Raw Final Score:", finalScore); // Debug log
      
      // Store the score in a separate state
      setFinalScore(finalScore);

      // Format the response for display
      const formattedResponse = rawResponse
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Convert **bold** to <strong>
        .replace(/\n/g, "<br><br>") // Add double line breaks for better spacing
        .replace(/(\d+️⃣)/g, "<h2>$1</h2>") // Convert numbers with emoji to large headings
        .replace(/- /g, "<li>") // Convert list items to proper bullet points
        .replace(/• /g, "<li>") // Handle different bullet types
        .replace(/<\/li><br>/g, "</li>") // Fix line breaks inside lists
        .replace(/<br><br><li>/g, "<ul><li>") // Start unordered list
        .replace(/<\/li><br><br>/g, "</li></ul>"); // Close unordered list
  
      setAnalysis(formattedResponse); 
      return finalScore; // Return the score for handleSubmit
    } catch (error) {
      console.error("AI Generation Error:", error);
      setAnalysis("<p style='color:red;'>An error occurred while generating AI response.</p>");
      return 0;
    } finally {
      setLoading(false);
    }
};

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const score = await handleGenerateAIResponse();
        
        const certificateUrls = await Promise.all(
            formData.certifications.map(async (cert) => {
                if (cert.certificateFile) {
                    const fileRef = ref(storage, `certificates/${cert.certificateFile.name}`);
                    await uploadBytes(fileRef, cert.certificateFile);
                    return getDownloadURL(fileRef);
                }
                return "";
            })
        );

        // Add this code to save to Firestore
        await addDoc(collection(db, 'tests'), {
            ...formData,
            userId: auth.currentUser.uid,
            finalScore: score,
            certifications: formData.certifications.map((cert, index) => ({
                name: cert.name || "Unknown",
                issuedBy: cert.issuedBy || "Unknown",
                issueDate: cert.issueDate || "Unknown",
                certificateUrl: certificateUrls[index]
            })),
            aiReport: analysis,
            timestamp: new Date()
        });

        // Navigate to dashboard after successful submission
        navigate('/dashboard');

    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error submitting form. Please try again.');
    }
};
  

  return (
    <>
      
      <div className="test-form-container">
        <form onSubmit={handleSubmit} className="test-form">
          <section className="form-section">
            <h2>Section 1: My Data</h2>
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="url"
                name="githubLink"
                placeholder="GitHub Link"
                value={formData.githubLink}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter skills (press Enter to add)"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyDown={handleSkillKeyDown}
              />
              <div className="skills-container">
                {formData.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
            <div className="form-group">
  <textarea
    name="interpersonalSkills"
    placeholder="Describe your interpersonal skills, teamwork, leadership, and communication"
    value={formData.interpersonalSkills}
    onChange={handleChange}
    required
  ></textarea>
</div>
          </section>

        
          <section className="form-section">
            <h2>Section 2: Education</h2>
            <div className="form-group">
              <select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select Education Level</option>
                <option value="12th">12th</option>
                <option value="college">College</option>
              </select>
            </div>

            {formData.educationLevel === '12th' && (
              <>
                <div className="form-group">
                  <input
                    type="text"
                    name="board"
                    placeholder="Board"
                    value={formData.board}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    name="percentage"
                    placeholder="Percentage"
                    value={formData.percentage}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="schoolName"
                    placeholder="School Name"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {formData.educationLevel === 'college' && (
              <>
                <div className="form-group">
                  <input
                    type="text"
                    name="collegeName"
                    placeholder="College Name"
                    value={formData.collegeName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="branchName"
                    placeholder="Branch Name"
                    value={formData.branchName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    name="cgpa"
                    placeholder="CGPA"
                    value={formData.cgpa}
                    onChange={handleChange}
                    required
                    min="0"
                    max="10"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="currentYear"
                    placeholder="Current Year"
                    value={formData.currentYear}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="passoutYear"
                    placeholder="Passout Year"
                    value={formData.passoutYear}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    name="internship"
                    placeholder="Internship Details (if any)"
                    value={formData.internship}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </section>

          
          <section className="form-section">
            <h2>Section 3: Certifications</h2>
            {formData.certifications.map((cert, index) => (
              <div key={index} className="certification-group">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Certification Name"
                    value={cert.name}
                    onChange={(e) => {
                      const newCerts = [...formData.certifications];
                      newCerts[index].name = e.target.value;
                      setFormData({ ...formData, certifications: newCerts });
                    }}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Issued By"
                    value={cert.issuedBy}
                    onChange={(e) => {
                      const newCerts = [...formData.certifications];
                      newCerts[index].issuedBy = e.target.value;
                      setFormData({ ...formData, certifications: newCerts });
                    }}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="date"
                    value={cert.issueDate}
                    onChange={(e) => {
                      const newCerts = [...formData.certifications];
                      newCerts[index].issueDate = e.target.value;
                      setFormData({ ...formData, certifications: newCerts });
                    }}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, index)}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                certifications: [...formData.certifications, { name: '', issuedBy: '', issueDate: '', certificateFile: null }]
              })}
              className="add-btn"
            >
              Add Certification
            </button>
          </section>

          
          <section className="form-section">
            <h2>Section 4: Personal Achievements</h2>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.hasAchievements}
                  onChange={(e) => setFormData({ ...formData, hasAchievements: e.target.checked })}
                />
                Do you have any achievements?
              </label>
            </div>

            {formData.hasAchievements && (
              <div className="achievements-container">
                {formData.achievements.map((achievement, index) => (
                  <div key={index} className="form-group">
                    <input
                      type="text"
                      placeholder="Achievement/Competition Name"
                      value={achievement}
                      onChange={(e) => {
                        const newAchievements = [...formData.achievements];
                        newAchievements[index] = e.target.value;
                        setFormData({ ...formData, achievements: newAchievements });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    achievements: [...formData.achievements, '']
                  })}
                  className="add-btn"
                >
                  Add Achievement
                </button>
              </div>
            )}

            <div className="form-group">
              <textarea
                name="socialActivities"
                placeholder="Social Activities"
                value={formData.socialActivities}
                onChange={handleChange}
              />
            </div>
          </section>

          <button type="submit" className="submit-btn">Submit</button>
        </form>

        <div className="analysis-container">
          <h2>AI Skill & Performance Analysis</h2>
          <button 
            onClick={handleGenerateAIResponse} 
            disabled={loading}
            className="generate-btn"
          >
            {loading ? "Generating..." : "Generate AI Analysis"}
          </button>

          {loading && <p className="loading-text">⏳ Please wait, AI is analyzing your data...</p>}

          {analysis && (
            <div className="analysis-output">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div 
                  dangerouslySetInnerHTML={{ __html: analysis }} 
                  className="analysis-content"
                />
              )}
            </div>
          )}
        </div>
      </div>
      
      
    </>
  );
};

export default TestForm;