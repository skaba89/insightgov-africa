declare module 'swagger-ui-react' {
  import { ComponentType } from 'react';
  
  interface SwaggerUIProps {
    url?: string;
    spec?: object;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    deepLinking?: boolean;
    requestInterceptor?: (request: any) => any;
    responseInterceptor?: (response: any) => any;
    onComplete?: () => void;
  }
  
  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
