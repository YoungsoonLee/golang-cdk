package response

// This is reponse json struct for return apigateway
import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

// Response ...
type Response struct {
	StatusCode int         `json:"statusCode"`
	IntnerCode int         `json:"interCode,omitempty"`
	Message    string      `json:"message,omitempty"`
	DevMessage string      `json:"devMessage,omitempty"`
	Data       interface{} `json:"data,omitempty"`
}

func output(r *Response) events.APIGatewayProxyResponse {

	// TODO(Ted): handle input param request if it needs.

	headers := make(map[string]string)
	headers["Content-Type"] = "application/json"

	var body []byte
	body, _ = json.Marshal(r)

	return events.APIGatewayProxyResponse{
		Body:       string(body),
		StatusCode: r.StatusCode,
		Headers:    headers,
	}
}

// Success ...
func Success(statusCode int, message string, data interface{}) (events.APIGatewayProxyResponse, error) {

	r := &Response{
		StatusCode: statusCode,
		Message:    message,
		Data:       data,
	}

	return output(r), nil

}
