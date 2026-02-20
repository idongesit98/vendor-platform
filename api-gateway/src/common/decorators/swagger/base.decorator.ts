import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiSuccessResponse } from './success-response.decorator';
import { SwaggerResponses } from './responses';

/**
 * This is a Swagger helper layer that standardizes response on falure and success
 * This endpoint requires bearer token for documentation
 * @param summary This is a summarry of the response gotten
 * @param responseType Generic response for the operation
 * @returns Either an success or an error response
 */

/**
 * ------------------------------------------------
 * ApiAuthGet
 * ------------------------------------------------
 * Custom Swagger decorator for authenticated GET endpoints.
 *
 * Automatically:
 * - Adds Bearer authentication
 * - Adds operation summary
 * - Adds standard success response (200)
 * - Adds 401 Unauthorized response
 */
export function ApiAuthGet<T>(summary: string, responseType?: Type<T>) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary }),
    ApiSuccessResponse({
      status: HttpStatus.OK,
      description: 'Success',
      type: responseType,
    }),
    ApiResponse(SwaggerResponses.unauthorized),
  );
}

/**
 * ------------------------------------------------
 * ApiAuthPost
 * ------------------------------------------------
 * Custom Swagger decorator for authenticated POST endpoints.
 *
 * Automatically:
 * - Adds Bearer authentication
 * - Adds operation summary
 * - Adds 201 Created success response
 * - Adds 400 & 401 error responses
 */
export function ApiAuthPost<T>(summary: string, responseType?: Type<T>) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary }),
    ApiSuccessResponse({
      status: HttpStatus.CREATED,
      description: 'Created',
      type: responseType,
    }),
    ApiResponse(SwaggerResponses.badRequest),
    ApiResponse(SwaggerResponses.unauthorized),
  );
}

/**
 * ------------------------------------------------
 * ApiAuthUpdate
 * ------------------------------------------------
 * Custom Swagger decorator for authenticated
 * PUT or PATCH endpoints.
 */
export function ApiAuthUpdate<T>(summary: string, responseType?: Type<T>) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary }),
    ApiSuccessResponse({
      status: HttpStatus.OK,
      description: 'Updated successfully',
      type: responseType,
    }),
    ApiResponse(SwaggerResponses.badRequest),
    ApiResponse(SwaggerResponses.unauthorized),
  );
}

/**
 * ------------------------------------------------
 * ApiPublic
 * ------------------------------------------------
 * Custom Swagger decorator for public endpoints
 * (no authentication required).
 */
export function ApiPublic<T>(summary: string, responseType?: Type<T>) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiSuccessResponse({
      status: HttpStatus.OK,
      description: 'Success',
      type: responseType,
    }),
  );
}
