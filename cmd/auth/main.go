package main

import (
	"net/http"

	"github.com/YoungsoonLee/golang-cdk/pkg/response"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

// HandlerRequest ...
func HandlerRequest(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

	return response.Success(http.StatusOK, "success", "")

}

func main() {
	// init config

	// start handler
	// it only example for using apigateway
	lambda.Start(HandlerRequest)
}
