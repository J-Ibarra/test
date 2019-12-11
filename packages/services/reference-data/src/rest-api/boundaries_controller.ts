import { Controller, Get, Route } from 'tsoa'
import { findAllBoundaries } from '../core/find_boundaries'

@Route('/boundaries')
export class BoundariesController extends Controller {
  @Get()
  public findAllBoundaries() {
    return findAllBoundaries()
  }
}
