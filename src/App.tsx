import React, { useEffect, useState } from 'react'
import './App.css'
import axios from "axios"
import {
  Container, Form, Button, Row, Col, Card, Alert, InputGroup
} from 'react-bootstrap'

const SERVER = "https://simple-http-ocr-3e385d2f5912.herokuapp.com/";

function ConnectionTestAlert() {
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  // test connection
  useEffect(() => {
    // Function to test the connection
    const testConnection = async () => {
      try {
        const response = await axios.get(`${SERVER}/health`);
        if (response.data.status === "running") {
          setConnectionStatus("success");
        } else {
          setConnectionStatus("error");
        }
      } catch (error) {
        setConnectionStatus("error");
      }
    };

    testConnection();

    // Clear the alert after 3 seconds
    const timer = setTimeout(() => {
      setConnectionStatus(null);
    }, 3000);

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []);


  return (<>
    {connectionStatus && (
      <Alert
        variant={connectionStatus === "success" ? "success" : "danger"}
        className="mb-3"
      >
        {connectionStatus === "success"
          ? "Connection to the OCR service is successful!"
          : "Failed to connect to the OCR service. Please check your connection."}
      </Alert>
    )}
  </>)
}

function App() {

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [unformattedText, setUnformattedText] = useState<string>("");
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textAreaPrompt, setTextAreaPrompt] = useState<string>("Enter unformatted transaction record here.");


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);

    // Update textAreaPrompt based on whether an image is selected
    if (file) {
      setTextAreaPrompt("And you can add some description for your image.");
    } else {
      setTextAreaPrompt("Enter unformatted transaction record here.");
    }
  };

  const handleDiscardFile = () => {
    setSelectedFile(null); // Clear the file
    setTextAreaPrompt("Enter unformatted transaction record here."); // Reset the prompt
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUnformattedText(event.target.value);
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();

    if (selectedFile) {
      formData.append("image", selectedFile);
    } else if (unformattedText) {
      formData.append("text", unformattedText);
    } else {
      setError("Please upload an image or enter unformatted text.");
      return;
    }
    try {
      const res = await axios.post(`${SERVER}/extract-and-format-ocr`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          }
        });

      setResponse(JSON.stringify(res.data, null, 2));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred while processing your request.");
      setResponse(null);
    }
  };


  return (
    <Container>
      <Row>
        <Col>
          <ConnectionTestAlert />
        </Col>
      </Row>
      <Row>
        <Col>
          <Card>
            <Card.Title>Reçu Rapid</Card.Title>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Upload Image</Form.Label>
                <InputGroup>
                  <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                  {selectedFile && (
                    <Button variant="danger" onClick={handleDiscardFile}>
                      Discard
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-3">
                {
                  (selectedFile) ?
                    (<></>) :
                    (
                      <Form.Label>Or Enter Unformatted Payment Records</Form.Label>

                    )
                }
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={unformattedText}
                  onChange={handleTextChange}
                  placeholder={textAreaPrompt}
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
      <Row className="mt-3">
        <Col>
          {response && (
            <Alert variant="success" className="text-start">
              <Alert.Heading>Your Transactions</Alert.Heading>
              <pre>{response}</pre>
            </Alert>
          )}
          {error && (
            <Alert variant="danger" className="text-start">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
  )


}

export default App
