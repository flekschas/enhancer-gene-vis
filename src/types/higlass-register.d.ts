declare module 'higlass-register' {
  import type { _Track, DataType } from '@higlass/tracks';

  type TrackDefinition = {
    track: PixiTrack;
    config: TrackDefinitionConfig;
    isMetaTrack?: boolean;
  };
  type TrackDefinitionConfig = {
    type: string;
    datatype: DataType[];
    /** Should be string enum at some point */
    orientation?: string;
    name?: string;
  };
  type RegisterOptions = {
    force?: boolean;
  };
  export default function register(
    definition: TrackDefinition,
    options: RegisterOptions = {}
  ): void;
}
