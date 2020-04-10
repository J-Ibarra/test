import { Controller, Get, Route, Tags } from 'tsoa'
import { findAllBoundaries } from '../core/find_boundaries'

@Tags('reference-data')
@Route('/boundaries')
export class BoundariesController extends Controller {
  @Get()
  public findAllBoundaries() {
    return findAllBoundaries()
  }
}
