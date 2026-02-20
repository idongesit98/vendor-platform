import { BaseApiResponseDto } from '@/common/dto';
import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';

interface ApiSuccessResponseOptions {
  type?: Type<any> | string;
  status?: number;
  description?: string;
}

export const ApiSuccessResponse = (options: ApiSuccessResponseOptions) => {
  const dataIsType = options.type && typeof options.type !== 'string';
  const status = options.status || 200;

  return applyDecorators(
    ApiExtraModels(
      BaseApiResponseDto,
      dataIsType ? (options.type as Type<any>) : Object,
    ),
    status === 201
      ? ApiCreatedResponse({
          description: options.description || 'Resource created successfully',
          schema: {
            allOf: [
              { $ref: getSchemaPath(BaseApiResponseDto) },
              {
                properties: {
                  data: dataIsType
                    ? { $ref: getSchemaPath(options.type as Type<any>) }
                    : { type: 'object' },
                },
              },
            ],
          },
        })
      : ApiOkResponse({
          description: options.description || 'Operation successful',
          schema: {
            allOf: [
              { $ref: getSchemaPath(BaseApiResponseDto) },
              {
                properties: {
                  data: dataIsType
                    ? { $ref: getSchemaPath(options.type as Type<any>) }
                    : { type: 'object' },
                },
              },
            ],
          },
        }),
  );
};
